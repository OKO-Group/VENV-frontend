// composables/useSunLighting.ts
import { reactive, type Reactive, ref, type ShallowRef } from 'vue'
import { useRenderLoop, useTexture, useTresContext } from '@tresjs/core'
import * as THREE from 'three'
import { Color, DirectionalLight, FogExp2, Vector3 } from 'three'
import SunCalc from 'suncalc'

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
    value: 19 // local hour: 0–23
  },
  minuteOverride: {
    enabled: false,
    value: 0 // local minute: 0–59
  }
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

export interface Moon {
  mesh: ShallowRef<THREE.Mesh | null>
  material: ShallowRef<THREE.MeshPhysicalMaterial | null>
  light: DirectionalLight
}

export async function useSunLighting(
  sky: any,
  sunLight: DirectionalLight,
  ambientLight: Reactive<any>,
  moon: Moon
) {
  const { scene, renderer } = useTresContext()
  const updateInterval = 0.04
  const timer = ref(0)
  const { latitude, longitude } = await getGeoFromIP()

  const now = new Date()
  const sunPosition = new Vector3()
  const moonDir = new THREE.Vector3()
  now.setHours(now.getHours() + 10.5)
  const updateSun = async () => {
    try {
      now.setSeconds(now.getSeconds() + 20)
      const pos = SunCalc.getPosition(now, latitude, longitude)
      sunPosition.setFromSphericalCoords(1, pos.azimuth, pos.altitude)
      sky.material.uniforms.sunPosition.value.copy(sunPosition)
      // Elevation & moonlight logic
      const elevation = Math.sin(pos.altitude)
      const sunriseMin = 0.38
      const sunriseMax = 0.55
      const isMoonNight = elevation < 0
      const isNight = elevation < sunriseMin
      const isSunrise = elevation < sunriseMax

      // Calculate the sky color based on scattering, turbidity, and sun position
      // Normalized elevation for easy calculations
      const elevationNormalized = Math.max(0, elevation)

      const skyColor = computeSkyColor(elevation, now.getHours() < 12 ? 'am' : 'pm')

      // Realistic sun/moon intensity and color
      sunLight.position.copy(sunPosition.clone().multiplyScalar(100))

      const t = Math.min(
        1,
        Math.max(0, (elevationNormalized - sunriseMin) / (sunriseMax - sunriseMin))
      )

      // Quadratic interpolation (ease in)
      sunLight.intensity = isMoonNight ? 1 : (isNight ? 0.001 : t ** 3)

      sunLight.color.set(isMoonNight ? 0xe8e8e8 : skyColor)

      // Turbidity: clearer sky at night, gradually hazier during sunrise/sunset
      sky.material.uniforms.turbidity.value = (1 - elevationNormalized) * 7 // From 6 (hazy at horizon) to 1 (clear daytime)

      // Rayleigh scattering: strong blue sky at day, fades smoothly at night
      sky.material.uniforms.rayleigh.value = 4 * (1 - elevationNormalized) ** 2 // 0 at night, smoothly increasing to 2.16 at midday

      // Mie coefficient: subtle at day, slightly increases at sunrise/sunset, then reduces at night
      sky.material.uniforms.mieCoefficient.value = 0.005 * (1 - elevationNormalized) ** 2 // Higher around sunrise/sunset (max 0.013), lower midday (0.003)

      // Mie directional scattering: consistent, but slightly more forward-scattering at sunrise/sunset
      sky.material.uniforms.mieDirectionalG.value = 1 - (elevationNormalized + 0.1) ** 2 // From 0.7 (daytime) to 0.8 (sunset/sunrise)

      ambientLight.intensity = elevationNormalized * 1.3 + 0.088
      ambientLight.color.set(skyColor)
      // Fog and background color
      const fogHue = isNight ? 0.62 : 0.1
      const fogSat = isNight ? 0.1 : 0.4
      const fogLightness = elevationNormalized ** 2

      scene.value.fog = new FogExp2(
        new Color().setHSL(fogHue, fogSat, fogLightness),
        isNight ? 0.0001 : isSunrise ? 0.1 * elevationNormalized**2 : 0.05 * elevationNormalized**2)

      renderer.value.setClearColor(skyColor)
      renderer.value.toneMappingExposure = Math.max(0.7, elevationNormalized)
    } catch (e) {
      console.warn('Sun position update failed:', e)
    }
  }

  function updateMoon() {
    if (!moon.light || !moon.mesh.value || !moon.material.value) return

    const moonPos = SunCalc.getMoonPosition(now, latitude, longitude)
    const illum = SunCalc.getMoonIllumination(now)

    // Direction from Earth observer to Moon
    moonDir.setFromSphericalCoords(1, Math.PI / 2 - moonPos.altitude, moonPos.azimuth + Math.PI)

    moon.light.position.copy(moonDir.clone().multiplyScalar(100))
    moon.mesh.value.position.copy(moonDir.clone().multiplyScalar(100))

    // Face the Earth (origin) — simulate tidal locking
    moon.mesh.value.lookAt(new THREE.Vector3(0, 0, 0))

    // Adjust light intensity based on altitude and illumination
    const visible = moonPos.altitude > 0
    const moonBrightness = visible
      ? Math.pow(Math.sin(moonPos.altitude), 2) * illum.fraction
      : 0
    moon.light.intensity = moonBrightness * 0.4

    // Apply phase tint (darker for crescent/new moon)
    const fullMoonColor = new THREE.Color(0xffffff)
    const shadowColor = new THREE.Color(0x222233)
    moon.material.value.color = fullMoonColor.clone().lerp(shadowColor, 1 - illum.fraction)

    // Simulate Earthshine on dark side of Moon
    if (ambientLight && !visible) {
      const earthshine = 0.05 + (1 - illum.fraction) * 0.1
      ambientLight.intensity += earthshine
    }
  }
  const updateCelestial = () => {
    updateSun()
    updateMoon()
  }

  const { onLoop } = useRenderLoop()
  onLoop(({ delta }) => {
    timer.value += delta
    if (timer.value >= updateInterval) {
      timer.value = 0
      updateCelestial()
      renderer.value.shadowMap.needsUpdate = true
    }
  })

  return { updateCelestial }
}

