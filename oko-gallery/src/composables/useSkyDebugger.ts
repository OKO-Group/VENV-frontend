import { sunCfg } from '@/composables/useSunLighting.ts'
import { GUI } from 'lil-gui'

import type { DirectionalLight } from 'three'
function addOverride(
  gui: GUI,
  label: string,
  config: { enabled: boolean; value: any },
  onChange?: (v: any) => void,
  slider?: { min: number; max: number; step?: number },
) {
  const folder = gui.addFolder(label)
  folder.add(config, 'enabled').name('Enable')
  const valueController = folder.add(config, 'value').name('Value')

  if (slider) {
    valueController.min(slider.min).max(slider.max)
    if (slider.step !== undefined) valueController.step(slider.step)
  }

  if (onChange) {
    valueController.onChange((v) => {
      if (config.enabled) onChange(v)
    })
  }
}

export function useSkyDebugger(sky: any, light: DirectionalLight, renderer: any) {
  const uniforms = sky.material.uniforms
  const guiContainer = document.getElementById('gui-container') || undefined
  const gui = new GUI({ container: guiContainer })
  gui.title('🕔 Clock')
  gui.close()
  addOverride(gui, 'Hour of Day', sunCfg.hourOverride, undefined, {
    min: 0,
    max: 23,
    step: 1,
  })
  addOverride(gui, 'Minute', sunCfg.minuteOverride, undefined, {
    min: 0,
    max: 59,
    step: 1,
  })

  // // Sky uniforms
  // addOverride(gui, 'Turbidity', sunCfg.turbidity, v => uniforms.turbidity.value = v, { min: 0, max: 20, step: 0.1 })
  // addOverride(gui, 'Rayleigh', sunCfg.rayleigh, v => uniforms.rayleigh.value = v, { min: 0, max: 4, step: 0.01 })
  // addOverride(gui, 'Mie Coefficient', sunCfg.mieCoefficient, v => uniforms.mieCoefficient.value = v, { min: 0, max: 1, step: 0.001 })
  // addOverride(gui, 'Mie Directional G', sunCfg.mieDirectionalG, v => uniforms.mieDirectionalG.value = v, { min: 0, max: 3, step: 0.01 })

  // // Light
  // addOverride(gui, 'Light Intensity', sunLightingConfig.lightIntensity, v => light.intensity = v, { min: 0, max: 2, step: 0.01 })
  //
  // // Sky color
  // addOverride(gui, 'Sky Hue', sunLightingConfig.skyHue, undefined, { min: 0, max: 1, step: 0.01 })
  // addOverride(gui, 'Sky Lightness', sunLightingConfig.skyLightness, undefined, { min: 0, max: 1, step: 0.01 })
  //
  // // Fog
  // addOverride(gui, 'Fog Hue', sunLightingConfig.fogHue, undefined, { min: 0, max: 1, step: 0.01 })
  // addOverride(gui, 'Fog Saturation', sunLightingConfig.fogSaturation, undefined, { min: 0, max: 1, step: 0.01 })
  // addOverride(gui, 'Fog Lightness', sunLightingConfig.fogLightness, undefined, { min: 0, max: 1, step: 0.01 })
  // addOverride(gui, 'Fog Density', sunLightingConfig.fogDensity, undefined, { min: 0, max: 0.1, step: 0.001 })
  //
  // // Background
  // addOverride(gui, 'Background Hue', sunLightingConfig.backgroundHue, undefined, { min: 0, max: 1, step: 0.01 })
  // addOverride(gui, 'Background Saturation', sunLightingConfig.backgroundSaturation, undefined, { min: 0, max: 1, step: 0.01 })
  // addOverride(gui, 'Background Lightness', sunLightingConfig.backgroundLightness, undefined, { min: 0, max: 1, step: 0.01 })
  //
  // // Overrides for sun calc
  // addOverride(gui, 'Elevation Override', sunLightingConfig.elevationOverride, undefined, { min: 0, max: 1, step: 0.01 })
  // addOverride(gui, 'Day Factor Override', sunLightingConfig.dayFactorOverride, undefined, { min: 0, max: 1, step: 0.01 })
}
