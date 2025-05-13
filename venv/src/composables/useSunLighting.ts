// composables/useSunLighting.ts
import { ref, onMounted, reactive, type Ref, type Reactive } from 'vue'
import { useRenderLoop, useTresContext } from '@tresjs/core'
import * as THREE from 'three'
import SunCalc from 'suncalc'
import { Color, FogExp2, Vector3, MathUtils, DirectionalLight, AmbientLight } from 'three'
import { max } from 'lodash-es'

export const sunCfg = reactive({
  turbidity: { enabled: false, value: 5 },
  rayleigh: { enabled: false, value: 2.116 },
  mieCoefficient: { enabled: false, value: 0.004 },
  mieDirectionalG: { enabled: false, value: 0.7 },
  lightIntensity: { enabled: false, value: 0.1 },

  elevationOverride: { enabled: false, value: 0.5 },
  dayFactorOverride: { enabled: false, value: 0.5 },

  skyHue: { enabled: false, value: 0.8 },
  skyLightness: { enabled: false, value: 0.1 },

  fogHue: { enabled: false, value: 0.6 },
  fogSaturation: { enabled: true, value: 0.33 },
  fogLightness: { enabled: false, value: 0.85 },
  fogDensity: { enabled: false, value: 0.02 },

  backgroundHue: { enabled: false, value: 0.6 },
  backgroundSaturation: { enabled: true, value: 0.6 },
  backgroundLightness: { enabled: false, value: 0.85 },
  hourOverride: {
    enabled: false,
    value: 12, // local hour: 0–23
  },
  minuteOverride: {
    enabled: false,
    value: 0, // local minute: 0–59
  },
})

// Lerp function to interpolate between two values
function lerp(start: number, end: number, t: number): number {
  return start + t * (end - start)
}

// Function to compute the HSL color based on the sun position
function computeSkyColor(sunElevation: number, direction: 'am' | 'pm'): THREE.Color {
  // HSL ranges
  const nightHue = 0.7 // Blue at night
  const sunriseHue = 0.2 // Reddish morning
  const nightSat = 0.2
  const nightLight = 0.1

  // Default values
  let hue = nightHue
  let sat = nightSat
  let light = nightLight

  // If it's early morning (before sunrise)
  if (direction === 'am' && sunElevation < 0.2) {
    // Peak lightness at sunElevation = -0.2
    const peak = Math.max(0, 1 - Math.pow((sunElevation + 0.2) / 0.2, 2)) // Parabola

    light = lerp(nightLight, 1, peak) // Boost lightness toward 1
    hue = lerp(nightHue, sunriseHue, peak) // Shift from night blue to morning red
    sat = lerp(nightSat, 1, peak)
  }

  return new THREE.Color().setHSL(hue % 1, sat, light)
}

const now = new Date()

export interface GeoResponse {
  ip: string
  city: string
  region: string
  country: string
  country_name: string
  latitude: number
  longitude: number
}

export const getGeoFromIP = async (): Promise<GeoResponse> => {
  const res = await fetch('https://freeipapi.com/api/json')
  if (!res.ok) throw new Error('Failed to fetch geolocation')
  return res.json()
}

export async function useSunLighting(
  sky: any,
  light: DirectionalLight,
  ambientLight: Reactive<any>,
) {
  const { scene, renderer } = useTresContext()
  const updateInterval = 33 // seconds
  const timer = ref(0)

  const sunPosition = new Vector3()
  const clearColor = new Color()

  const { latitude, longitude } = await getGeoFromIP()

  const updateSun = async () => {
    try {
      if (sunCfg.hourOverride.enabled) {
        now.setHours(sunCfg.hourOverride.value, sunCfg.minuteOverride.value)
      }
      now.setSeconds(now.getSeconds())

      const pos = SunCalc.getPosition(now, latitude, longitude)
      sunPosition.setFromSphericalCoords(1, pos.azimuth, pos.altitude)
      sky.material.uniforms.sunPosition.value.copy(sunPosition)
      // ☀️ Elevation & moonlight logic
      const elevation = Math.sin(pos.altitude)
      const sunriseMin = 0.368
      const sunriseMax = 0.55
      const isNight = elevation < sunriseMin
      const isSunrise = elevation < sunriseMax

      // Calculate the sky color based on scattering, turbidity, and sun position
      // Normalized elevation for easy calculations
      const elevationNormalized = Math.max(0, elevation)

      const skyColor = computeSkyColor(elevation, now.getHours() < 12 ? 'am' : 'pm')

      // Realistic sun/moon intensity and color
      light.position.copy(sunPosition.clone().multiplyScalar(100))

      const t = Math.min(
        1,
        Math.max(0, (elevationNormalized - sunriseMin) / (sunriseMax - sunriseMin)),
      )

      // Quadratic interpolation (ease in)
      light.intensity = isNight ? 0 : t ** 3

      light.color.set(skyColor)

      // Turbidity: clearer sky at night, gradually hazier during sunrise/sunset
      sky.material.uniforms.turbidity.value = (1 - elevationNormalized) * 7 // From 6 (hazy at horizon) to 1 (clear daytime)

      // Rayleigh scattering: strong blue sky at day, fades smoothly at night
      sky.material.uniforms.rayleigh.value = 4 * (1 - elevationNormalized) ** 2 // 0 at night, smoothly increasing to 2.16 at midday

      // Mie coefficient: subtle at day, slightly increases at sunrise/sunset, then reduces at night
      sky.material.uniforms.mieCoefficient.value = 0.005 * (1 - elevationNormalized) ** 2 // Higher around sunrise/sunset (max 0.013), lower midday (0.003)

      // Mie directional scattering: consistent, but slightly more forward-scattering at sunrise/sunset
      sky.material.uniforms.mieDirectionalG.value = 1 - (elevationNormalized + 0.1) ** 2 // From 0.7 (daytime) to 0.8 (sunset/sunrise)

      ambientLight.intensity = elevationNormalized * 1.3
      ambientLight.color.set(skyColor)
      // Fog and background color
      const fogHue = isNight ? 0.62 : 0.1
      const fogSat = isNight ? 0.1 : 0.4
      const fogLightness = elevationNormalized ** 2

      scene.value.fog = new FogExp2(
        new Color().setHSL(fogHue, fogSat, fogLightness),
        isNight ? 0.001 : isSunrise ? 0.01 : elevationNormalized * 0.03,
      )

      renderer.value.setClearColor(skyColor)
      renderer.value.toneMappingExposure = Math.max(0.7, elevationNormalized)
    } catch (e) {
      console.warn('Sun position update failed:', e)
    }
  }

  await updateSun()


  onMounted(updateSun)

  const { onLoop } = useRenderLoop()
  onLoop(({ delta }) => {
    timer.value += delta
    if (timer.value >= updateInterval) {
      timer.value = 0
      updateSun()
      renderer.value.shadowMap.needsUpdate = true
    }
  })
}
