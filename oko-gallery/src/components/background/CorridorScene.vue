<script setup lang="ts">
import {
  defineEmits,
  onMounted,
  reactive,
  ref,
  type ShallowReactive,
  shallowReactive,
  shallowRef,
  watch,
  nextTick, onBeforeUnmount
} from 'vue'
import { useRenderLoop, useTresContext } from '@tresjs/core'
import * as THREE from 'three'
import { Quaternion, Vector3 } from 'three'
import { type Artwork } from '@/types/oko.ts'
import gsap from 'gsap'
import { canvasRGBA } from 'stackblur-canvas'
import HeightToNormal from 'height-to-normal-map'
import { Sky } from 'three/examples/jsm/Addons.js'
import { useArtworkStore } from '@/stores/artworks.ts'
import { useSunLighting } from '@/composables/useSunLighting.ts'
import { useSkyDebugger } from '@/composables/useSkyDebugger.ts'
import { routeBus } from '@/utils/routeBus.ts'
import { useMediaQuery } from '@vueuse/core'
import { isMobile } from '@/utils/isMobile.ts'

const props = defineProps<{
  artworks: Artwork[]
}>()

const GOLDENRATIO = 1.61803398875
const emit = defineEmits<{
  (e: 'replaceArtwork', value: number): void
  (e: 'clickedArtwork', value: number): void
}>()

const images = [
  { position: [0, 1, 3], rotation: [0, 0, 0] },
  { position: [-1.75, 1, 3], rotation: [0, 1, 0] },
  { position: [1.75, 1, 3], rotation: [0, -1, 0] }
]

const pointer = new THREE.Vector2()
const { scene, camera, renderer, raycaster } = useTresContext()


function onScenePointer(event: any) {
  const pointerX = (event.clientX / window.innerWidth) * 2 - 1
  const pointerY = -(event.clientY / window.innerHeight) * 2 + 1
  raycaster.value.setFromCamera({ x: pointerX, y: pointerY }, camera.value)

  const hits = raycaster.value.intersectObjects(scene.value.children, true)
  if (hits.length > 0) {
    hits.forEach((hit) => {
      const object = hit.object
      // You must identify the object and map it to the index or data
      if (object.name) {
        onClick({ object }) // Call your existing click logic
        return
      }
    })
  }
}

if (isMobile) {
  window.addEventListener('pointerdown', onScenePointer)
}
const materialRefs: ShallowReactive<
  Record<
    number,
    {
      frame?: THREE.MeshStandardMaterial
      border?: THREE.MeshBasicMaterial
      image?: THREE.MeshPhysicalMaterial
    }
  >
> = shallowReactive({})

const frameRefs = shallowRef<Record<number, THREE.Mesh>>({})
const activeId = ref<number | null>(null)
const hoveredId = ref<number | null>(null)
const targetPosition = new Vector3(0, 1.8, 20)
const targetQuaternion = new Quaternion()
const seenIDs = new Set()
const displayedArtworks = ref<Artwork[]>([])
const groundMaterial = shallowRef<THREE.MeshStandardMaterial | null>(null)
const groundMesh = shallowRef<THREE.Mesh | null>(null)

//Fog
scene.value.fog = new THREE.FogExp2('#d8c7ac', 0.01)

//Sky
const sky = new Sky()
sky.scale.setScalar(450000)
scene.value.add(sky)

const light = new THREE.DirectionalLight(0xffffff, 0.2)
light.castShadow = true
light.shadow.bias = -0.001
scene.value.add(light)

const ambientLight = reactive({ intensity: 0.5, color: new THREE.Color() })
// Enable adaptive sun lighting
useSunLighting(sky, light, ambientLight)
renderer.value.shadowMap.enabled = true

useSkyDebugger(sky, light, renderer.value)

const artworkStore = useArtworkStore()
watch(
  () => artworkStore.cameraPos,
  (newVal) => {
    targetPosition.set(newVal[0], newVal[1], newVal[2])
    targetQuaternion.identity()
  }
)

function shuffleArtwork(index: number | null) {
  if (index === -1 || index === null) return

  const currentId = displayedArtworks.value[index].id
  seenIDs.add(currentId)
  const currentArtworks = props.artworks.map((a) => a.id).join(',')

  fadeArtwork(index, 0, async () => {
    let replacement: Artwork | null = null
    const timeoutPromise = new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve()
      }, 33000) // 33 seconds
    })

    const artworkUpdatePromise = new Promise<boolean>((resolve) => {
      const stop = watch(
        () => props.artworks.map((a) => a.id).join(','),
        (newIds, oldIds) => {
          if (newIds !== currentArtworks) {
            stop()
            resolve(true)
          }
        },
        { immediate: false }
      )
    })
    let updatedPool = props.artworks.filter((a) => !seenIDs.has(a.id))
    if (updatedPool.length > 0) {
      replacement = updatedPool[Math.floor(Math.random() * updatedPool.length)]
    } else {
      emit('replaceArtwork', currentId)
      const res = await Promise.race([timeoutPromise, artworkUpdatePromise])
      if (res === undefined) {
        // console.log('timeout reached')
        return
      } else {
        // console.log('updated artworks')
        updatedPool = props.artworks.filter((a) => !seenIDs.has(a.id))
        replacement = updatedPool[Math.floor(Math.random() * updatedPool.length)] //TODO clean other Promise
        if (!replacement) {
          console.log('No more artworks here...')
          return
        }
      }
    }
    // Apply replacement and fade in
    displayedArtworks.value[index] = replacement
    const file = replacement.files.find((f) => f.category === 'painting')?.file
    loadArtworkFile(replacement, file!, index) //TODO concurrency with texture loader
    fadeArtwork(index, 1)
  })
}

// Animate camera
const cameraMovementComplete = shallowRef(false)

useRenderLoop().onLoop(() => {
  if (!camera.value) return
  // Camera lerp logic
  camera.value.position.lerp(targetPosition, 0.023)
  camera.value.quaternion.slerp(targetQuaternion, 0.023)
  if (
    activeId.value !== null &&
    !cameraMovementComplete.value &&
    camera.value.position.distanceTo(targetPosition) < 0.1
  ) {
    cameraMovementComplete.value = true
  }
})

// Click to focus logic
function updateCameraTarget() {
  const mesh = activeId.value != null ? frameRefs.value[activeId.value] : null
  if (mesh) {
    mesh.parent?.updateWorldMatrix(true, true)
    mesh.parent?.localToWorld(targetPosition.set(0, 0.85, isMobile ? 2.1 : 1.3))
    mesh.parent?.getWorldQuaternion(targetQuaternion)
  } else {
    targetPosition.set(0, 1.8, isMobile ? 13.3 : 6)
    targetQuaternion.identity()
  }
  cameraMovementComplete.value = false
}

watch(
  () => cameraMovementComplete.value,
  async (newVal) => {
    if (newVal && activeId.value !== null) {
      await updateTerrainFromTexture(textures.value[activeId.value])
    }
  }
)

async function onClick(e: any) {
  if (!e.object.name) return
  const id = Number(e.object.name)
  emit('clickedArtwork', id)
  const prev = activeId.value
  activeId.value = activeId.value === id ? null : id
  updateCameraTarget()
  shuffleArtwork(prev)
  animateEmissiveColor(id, defaultEmissiveColor)
}

const hoverEmissiveColor = { r: 0.01, g: 0.01, b: 0.01 }
const defaultEmissiveColor = { r: 0, g: 0, b: 0 }

// Function to animate emissive color
function animateEmissiveColor(id: number, toColor: { r: number; g: number; b: number }) {
  const mat = materialRefs[id]
  gsap.to([mat.frame?.emissive, mat.image?.emissive], {
    r: toColor.r,
    g: toColor.g,
    b: toColor.b,
    duration: 1,
    ease: 'power2.out'
  })
}

function onPointerEnter(e: any) {
  document.body.style.cursor = 'pointer'
  if (e.object.name === '') return
  const id = Number(e.object.name)
  hoveredId.value = id
  if (id != activeId.value) animateEmissiveColor(id, hoverEmissiveColor)
}

function onPointerOut(e: any) {
  document.body.style.cursor = 'default'
  if (e.object.name === '') return
  const id = Number(e.object.name)
  if (id != activeId.value) animateEmissiveColor(id, defaultEmissiveColor)
  hoveredId.value = null
}

const textures = ref<Record<number, THREE.Texture>>({})
const aspectRatios = ref<Record<number, number>>({})
const loader = new THREE.TextureLoader()

function initArtworks() {
  images.forEach((_, i) => {
      materialRefs[i] = {
        frame: undefined,
        border: undefined,
        image: undefined
      }
    }
  )
}

async function initTerrain(onComplete?: () => void) {
  if (!groundMaterial.value) return
  const map = await loader.loadAsync('/sand-dunes1_albedo.png')
  const aoMap = await loader.loadAsync('/sand-dunes1_ao.png')
  const displacementMap = await loader.loadAsync('/sand-dunes1_height.png')
  const displacementScale = 0.3 // Adjust strength as needed
  const metalnessMap = await loader.loadAsync('/sand-dunes1_metallic.png')
  const normalMap = await loader.loadAsync('/sand-dunes1_normal-dx.png')
  const roughnessMap = await loader.loadAsync('/sand-dunes1_roughness.png')
  groundMaterial.value.map = map
  groundMaterial.value.aoMap = aoMap
  groundMaterial.value.displacementMap = displacementMap
  groundMaterial.value.displacementScale = displacementScale
  groundMaterial.value.metalnessMap = metalnessMap
  groundMaterial.value.normalMap = normalMap
  groundMaterial.value.roughnessMap = roughnessMap
  groundMaterial.value.transparent = true
  groundMaterial.value.shadowSide = THREE.FrontSide
  groundMaterial.value.map.wrapS = groundMaterial.value.map.wrapT = THREE.RepeatWrapping
  groundMaterial.value.map.repeat.set(100, 100)
  groundMaterial.value.aoMapIntensity = 1.0
  gsap.to(groundMaterial.value!, {
    opacity: 1,
    duration: 2,
    ease: 'sine.inOut',
    onUpdate: () => {
      groundMaterial.value!.needsUpdate = true
    },
    onComplete: () => {
      onComplete?.()
      groundMaterial.value!.transparent = false
    }
  })
}


initArtworks()

onMounted(async () => {
  await initTerrain(() => {
    watch(() => props.artworks,
      (newArtworks) => {
        if (!newArtworks) return
        displayedArtworks.value = []
        newArtworks.slice(0, images.length).forEach((artwork, i) => {
          displayedArtworks.value[i] = artwork
          const file = artwork.files.find((f) => f.category === 'painting')?.file
          if (file) {
            loadArtworkFile(artwork, file, i)
            fadeArtwork(i, 1)
          }
        })
      }, { immediate: true })
  })
})


routeBus.on('route-change', ({ from, to }) => {
  if (from === '/explore' && to !== '/explore') {
    Object.keys(displayedArtworks.value).forEach((key) => {
      const index = Number(key)
      fadeArtwork(index, 0.33)
    })
  }
})

routeBus.on('route-change', ({ from, to }) => {
  if (to == '/explore') {
    Object.keys(displayedArtworks.value).forEach((key) => {
      const index = Number(key)
      fadeArtwork(index, 1)
    })
  }
})

function loadArtworkFile(artwork: Artwork, file: string, i: number) {
  loader.load(file, (texture) => {
    textures.value[i] = texture
    aspectRatios.value[i] = texture.image.width / texture.image.height
    seenIDs.add(artwork.id)
  })
}

function fadeArtwork(id: number, toOpacity: number, onComplete?: () => void) {
  const mat = materialRefs[id]
  gsap.to([mat.frame, mat.border, mat.image, frameRefs.value[id].material], {
    opacity: toOpacity,
    duration: 1,
    onComplete,
    overwrite: true,
    ease: 'power2.out'
  })
}

const processingCanvas = document.createElement('canvas')
const processingCtx = processingCanvas.getContext('2d', { willReadFrequently: true })

const heightToNormal = new HeightToNormal() // persistent instance
let sharedHeightMap: THREE.DataTexture | null = null

async function updateTerrainFromTexture(sourceTexture: THREE.Texture) {
  const img = sourceTexture.image
  if (groundMaterial.value!.displacementScale > 0) {
    gsap.to(groundMaterial.value!, {
      displacementScale: 0,
      duration: 1,
      ease: 'sine.in',
      onUpdate: () => {
        groundMaterial.value!.needsUpdate = true
      },
      onComplete: () => {
        processingCanvas.width = img.width
        processingCanvas.height = img.height
        processingCtx!.drawImage(img, 0, 0)

        // Optionally smooth
        canvasRGBA(processingCanvas, 0, 0, img.width, img.height, 10)

        const imageData = processingCtx!.getImageData(0, 0, img.width, img.height)

        const sharedHeightData = new Uint8Array(img.width * img.height)
        sharedHeightMap = new THREE.DataTexture(
          sharedHeightData,
          img.width,
          img.height,
          THREE.RedFormat
        ) //TODO look into compression and sample
        sharedHeightMap.type = THREE.UnsignedByteType
        sharedHeightMap.colorSpace = THREE.NoColorSpace
        sharedHeightMap.minFilter = THREE.LinearFilter
        sharedHeightMap.magFilter = THREE.LinearFilter
        sharedHeightMap.wrapS = THREE.ClampToEdgeWrapping
        sharedHeightMap.wrapT = THREE.ClampToEdgeWrapping
        sharedHeightMap.generateMipmaps = false //TODO read up on this
        sharedHeightMap.anisotropy = 2

        for (let i = 0; i < imageData.data.length; i += 4) {
          sharedHeightData[i / 4] =
            (imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2]) / 3
        }
        // extract html image from canvas
        // Reuse normalMap canvas + texture
        heightToNormal.apply(processingCanvas, {
          blursharp: 0,
          strength: 2
        })
        sharedHeightMap.image.width = img.width
        sharedHeightMap.image.height = img.height
        sharedHeightMap.image.data = sharedHeightData
        sharedHeightMap.needsUpdate = true

        // Apply to ground
        const targetDisplacementScale = 2.3
        const displacementDuration = 3
        const easeType = 'sine.inOut'
        groundMaterial.value!.displacementMap = sharedHeightMap
        gsap.to(groundMaterial.value!, {
          displacementScale: targetDisplacementScale,
          duration: displacementDuration,
          ease: easeType,
          onUpdate: () => {
            groundMaterial.value!.needsUpdate = true
            renderer.value.shadowMap.needsUpdate = true
          }
        })

        const originalY = groundMesh.value!.position.y
        if (originalY >= 0) {
          // Animate ground position simultaneously
          const displacementOffset = -targetDisplacementScale * 0.5 // Compensate half the height visually
          gsap.to(groundMesh.value!.position, {
            y: originalY + displacementOffset,
            duration: displacementDuration,
            ease: easeType
          })
        }
      }
    })
  }
}

let rippleTime = 0
useRenderLoop().onLoop(({ delta }) => {
  if (!groundMaterial.value) return
  rippleTime += delta
  const bias = Math.sin(rippleTime) * 0.01
  groundMaterial.value.displacementBias = bias
})
</script>

<template>
  <TresHemisphereLight
    :intensity="ambientLight.intensity"
    :color="ambientLight.color"
    :ground-color="0xfff7de"
  />
  <TresGroup
    v-for="(artwork, i) in images"
    :key="i"
    :position="[...images[i].position]"
    :rotation="[...images[i].rotation]"
  >
    <!-- Outer Frame -->
    <TresMesh
      :name="i.toString()"
      :position="[0, GOLDENRATIO / 2, 0]"
      :scale="[1 * aspectRatios[i], 1, 0.05]"
      @click="(e) => {if (isMobile) onClick}"
      @pointer-enter="
        (e) => {
          onPointerEnter(e);
        }
      "
      @pointer-out="
        (e) => {
          onPointerOut(e);
        }
      "
      :ref="
        (el: any) => {
          if (el) {
            frameRefs[i] = el
          }
        }
      "
      cast-shadow
      receive-shadow
      wrapAround
    >
      <TresBoxGeometry />
      <TresMeshStandardMaterial
        :ref="
          (el: any) => {
            if (el) {
              materialRefs[i].frame = el
            }
          }
        "
        :opacity="0"
        color="#151515"
        :metalness="0.5"
        :roughness="0.5"
        transparent
      />
      <!-- Border -->
      <TresMesh :scale="[0.9, 0.93, 0.9]" :position="[0, 0, 0.2]">
        <TresBoxGeometry />
        <TresMeshStandardMaterial
          :opacity="0"

          :ref="
            (el: any) => {
              if (el) {
                materialRefs[i].border = el
              }
            }
          "
          transparent
        />
      </TresMesh>

      <!-- Artwork Image -->
      <TresMesh :position="[0, 0, 0.7]">
        <TresPlaneGeometry />
        <TresMeshPhysicalMaterial
          :ref="
            (el: any) => {
              if (el) {
                materialRefs[i].image = el
              }
            }
          "
          :opacity="0"
          :map="textures[i]"
          :metalness="0.05"
          :roughness="0.8"
          :sheen="0.05"
          :sheenColor="0xffffff"
          :clearcoat="0."
          :iridescence="0.1"
          :reflectivity="0.9"
          :clearcoatRoughness="0.81"
          transparent
        />
      </TresMesh>
    </TresMesh>
  </TresGroup>

  <!-- Ground Plane -->
  <TresMesh :rotation="[-Math.PI / 2, 0, 0]" cast-shadow receive-shadow ref="groundMesh">
    <TresPlaneGeometry :args="[100, 100, 256, 256]" />
    <!-- use enough segments for displacement -->
    <TresMeshPhysicalMaterial
      ref="groundMaterial"
      :metalness="0.5"
      :roughness="0.33"
      :opacity="0"
      transparent
      :iridescence="0.7"
      :reflectivity="0.95"
      :emissive="[0.01, 0.01, 0.01]"
    />
  </TresMesh>
</template>
