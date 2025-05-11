<script setup lang="ts">
import { ref, computed, shallowRef, type Ref, watch, nextTick, toRaw, onBeforeMount } from 'vue'
import {
  mdiEyeOutline,
  mdiUndo,
  mdiLink,
  mdiLinkOff,
  mdiLocationExit,
  mdiSoundcloud,
  mdiAlbum,
  mdiEye,
  mdiCheckBold,
  mdiUpload,
  mdiBrush,
  mdiPencilCircle,
  mdiDeleteForever,
  mdiDeleteCircle,
} from '@mdi/js'
import { type Artwork, ArtworkFileCategory } from '@/types/oko'
import { fileCategories } from '@/types/oko.ts'
import { useFileDialog, useMediaQuery, useObjectUrl, watchPausable } from '@vueuse/core'
import { useArtworkStore } from '@/stores/artworks.ts'
import { useAuthStore } from '@/stores/auth.ts'
import clonedeep from 'lodash.clonedeep'
import { getChangedFields } from '@/utils/utils.ts'
import { HttpStatusCode } from 'axios'

// Props
const props = defineProps<{
  artwork: Artwork
  isCreatingNew: boolean
  filterdb: {
    styles: any[]
    genres: any[]
    media: any[]
  }
}>()

//Stores
const artworkStore = useArtworkStore()
const authStore = useAuthStore()

//Local state
const subTab = ref<ArtworkFileCategory>(ArtworkFileCategory.PAINTING)
const aspectLocked = ref(true)
const fileInput = ref<{
  fid: number | null
  el: HTMLInputElement | null
}>({ fid: null, el: null })
const isEditMode = shallowRef(false)

const selectedArtworkUploadFiles = fileCategories.reduce(
  (acc, category) => {
    //overkill
    acc[category] = shallowRef()
    return acc
  },
  {} as Record<ArtworkFileCategory, Ref<File | undefined>>,
)

const selectedArtworkUploadURLS = fileCategories.reduce(
  (acc, category) => {
    acc[category] = useObjectUrl(selectedArtworkUploadFiles[category])
    return acc
  },
  {} as Record<ArtworkFileCategory, Ref<string | undefined>>,
)

const canEditSelected = computed(() => {
  if (!props.artwork) return false
  return authStore.user?.id === props.artwork.user.id
})
const stagedFileDeletions = ref(new Set<ArtworkFileCategory>())

//Emits
const emit = defineEmits<{
  (e: 'updateArtwork', artwork: Artwork): void
  (e: 'uploadArtwork', artwork: Artwork): void
  (e: 'deleteArtwork'): void
  (e: 'close'): void
}>()

const editState = ref({
  artwork: props.artwork,
  files: selectedArtworkUploadFiles,
  stagedDeletions: stagedFileDeletions,
} as {
  artwork: Artwork
  files: Record<ArtworkFileCategory, Ref<File | undefined>>
  stagedDeletions: Ref<Set<ArtworkFileCategory>>
})
const isModifiedArtwork = shallowRef(false)
const { pause, resume } = watchPausable(
  editState,
  () => {
    isModifiedArtwork.value = true
  },
  { deep: true },
)

function purgeInMemoryFiles() {
  for (const category of fileCategories) {
    selectedArtworkUploadFiles[category].value = undefined
  }
}

async function resetArtwork(editMode = false) {
  pause()
  if (editMode) editState.value.artwork = clonedeep(props.artwork) //TODO on demand cloning
  purgeInMemoryFiles()
  stagedFileDeletions.value.clear()
  await nextTick()
  resume()
  isEditMode.value = editMode
  isModifiedArtwork.value = false
}

function fetchSelectedFile(category: ArtworkFileCategory) {
  return props.artwork.files.find((f) => f.category === category)?.file || undefined
}

function getArtworkImageSrc(category: ArtworkFileCategory): string | undefined {
  // Priority 1: local
  if (!props.artwork) return undefined

  //editing/viewing own
  if (props.artwork.user.id === authStore.user?.id) {
    const f = selectedArtworkUploadFiles[category].value
    return f
      ? selectedArtworkUploadURLS[category].value
      : !stagedFileDeletions.value.has(category)
        ? fetchSelectedFile(category)
        : undefined
  }
  //foreign
  return fetchSelectedFile(category)
}

const artworkImageSources = computed(() =>
  Object.fromEntries(fileCategories.map((category) => [category, getArtworkImageSrc(category)])),
)

const aspectLockSize = (val: number | undefined) => {
  if (aspectLocked.value && editState.value.artwork) {
    editState.value.artwork.parameters.w = editState.value.artwork.parameters.h = val
  }
}

const { open, onChange, onCancel } = useFileDialog({
  multiple: false,
  reset: true,
  accept: 'image/png, image/jpeg, image/bmp, image/jpg',
})

onChange((files) => {
  const file = files?.[0]
  if (!file || fileInput.value.fid === null) return
  const MAX_FILE_SIZE = 33 * 1024 * 1024
  if (file.size > MAX_FILE_SIZE) {
    alert('Image must be under 33MB')
    return
  }
  const category = fileCategories[fileInput.value.fid]
  selectedArtworkUploadFiles[category].value = file
})

onCancel(() => {
  if (!isModifiedArtwork.value) {
    resetArtwork()
  }
})

function triggerFilePicker(fid: number) {
  fileInput.value.fid = fid
  open()
}

const stageFileDelete = async (category: ArtworkFileCategory) => {
  isModifiedArtwork.value = true
  await nextTick()
  if (selectedArtworkUploadFiles[category].value) {
    selectedArtworkUploadFiles[category].value = undefined
  } else {
    stagedFileDeletions.value.add(category)
  }
}
const undoStageFileDelete = (category: ArtworkFileCategory) => {
  stagedFileDeletions.value.delete(category)
  selectedArtworkUploadFiles[category].value = undefined
}

const stagedFilePresent = (category: ArtworkFileCategory) => {
  return stagedFileDeletions.value.has(category)
}

function loadFileUpdates(data: Record<string, any>) {
  for (const category of fileCategories) {
    const file = selectedArtworkUploadFiles[category].value
    if (file) {
      data[category] = file
    } else if (stagedFileDeletions.value.has(category)) {
      data[category] = '__delete__'
    }
  }
  return data
}

const commitArtworkUpdate = async () => {
  if (!editState.value.artwork) return
  let artworkData
  if (props.isCreatingNew) {
    const data = toRaw(editState.value.artwork) as Record<string, any>
    delete data.user
    artworkData = await artworkStore.uploadArtwork(loadFileUpdates(data))
  } else {
    const changedFields = getChangedFields(toRaw(props.artwork), toRaw(editState.value.artwork))
    delete changedFields.user
    delete changedFields.files
    artworkData = await artworkStore.updateArtwork(
      editState.value.artwork.id,
      loadFileUpdates(changedFields),
    )
  }
  if (artworkData) {
    if (artworkStore.statusCode === HttpStatusCode.Ok) {
      await resetArtwork()
      emit('updateArtwork', artworkData)
    } else if (artworkStore.statusCode === HttpStatusCode.Created) {
      emit('uploadArtwork', artworkData)
    } else {
      alert(`Error uploading artwork.\\${authStore.errors['error']}`)
    }
  } else {
    alert(`Unexpected network error.`)
  }
}
const deleteArtwork = async () => {
  //delete current artwork
  if (!editState.value.artwork) return
  await artworkStore.deleteArtwork(editState.value.artwork.id)
  if (artworkStore.statusCode === HttpStatusCode.NoContent) {
    emit('deleteArtwork')
  } else {
    alert(`Error deleting artwork.\\${authStore.errors['error']}`)
  }
}
watch(
  () => props.artwork,
  () => resetArtwork(props.isCreatingNew),
  { immediate: true },
)
const createdAtProxy = computed<Date | null>({
  get() {
    const value = editState.value.artwork.created_at
    return value ? new Date(value) : null
  },
  set(date: Date | null) {
    editState.value.artwork.created_at = date?.toISOString() ?? Date.now().toString()
  },
})

const fullscreenImage = ref<string | undefined>(undefined)

function openImageViewer(imageUrl: string) {
  fullscreenImage.value = imageUrl
}

function closeImageViewer() {
  fullscreenImage.value = undefined
}

const isMobile = useMediaQuery('(max-width: 768px)')
</script>

<template>
  <v-dialog v-model="fullscreenImage" fullscreen persistent>
    <template #default="{ isActive }">
      <div class="image-viewer-overlay" @click="closeImageViewer">
        <v-img :src="fullscreenImage" class="fullscreen-img" height="90vh" contain />
      </div>
    </template>
  </v-dialog>
  <v-col v-if="artwork" :cols="!isMobile ? 4 : undefined" class="artwork-panel">
    <v-card class="pa-5 d-flex flex-column justify-space-between" height="80vh">
      <v-tabs v-model="subTab" align-tabs="center" height="40">
        <v-tab
          v-if="canEditSelected || artworkImageSources[ArtworkFileCategory.PAINTING]"
          :value="ArtworkFileCategory.PAINTING"
          >Painting
        </v-tab>
        <v-tab
          v-if="canEditSelected || artworkImageSources[ArtworkFileCategory.STUDY]"
          :value="ArtworkFileCategory.STUDY"
          >Study
        </v-tab>
        <v-tab
          v-if="canEditSelected || artworkImageSources[ArtworkFileCategory.SKETCH]"
          :value="ArtworkFileCategory.SKETCH"
          >Sketch
        </v-tab>
      </v-tabs>
      <div class="scroll-area">
        <!-- Image tabs -->
        <v-tabs-window v-model="subTab">
          <v-tabs-window-item
            v-for="[index, category] in fileCategories.entries()"
            :key="index"
            :value="category"
            class="avatar-card"
          >
            <v-hover v-slot="{ isHovering, props: hoverProps }">
              <div class="image-wrapper">
                <v-img
                  v-if="artworkImageSources[category]"
                  :src="artworkImageSources[category]"
                  class="artwork-img"
                  @click="openImageViewer(artworkImageSources[category])"
                />
                <div v-else class="icon-container">
                  <v-icon :icon="mdiEyeOutline" color="grey" class="artwork-img" />
                </div>
              </div>
            </v-hover>
            <div v-if="artworkImageSources[category]" class="image-buttons">
              <v-btn
                v-if="!isCreatingNew && canEditSelected && artwork"
                :icon="mdiPencilCircle"
                class="description-edit-btn opacity-70"
                @click="resetArtwork(true)"
              >
              </v-btn>
              <v-btn
                class="description-edit-btn"
                v-if="canEditSelected"
                icon
                @click="
                  () => {
                    if (!isEditMode) resetArtwork(true)
                    triggerFilePicker(index)
                  }
                "
              >
                <v-icon :icon="mdiBrush" />
              </v-btn>
              <v-btn
                class="description-edit-btn"
                v-if="canEditSelected"
                icon
                @click="
                  () => {
                    if (!isEditMode) resetArtwork(true)
                    stageFileDelete(category)
                  }
                "
              >
                <v-icon :icon="mdiDeleteCircle" />
              </v-btn>
            </div>
            <div v-else class="image-buttons" v-if="canEditSelected">
              <v-btn
                class="description-edit-btn"
                icon
                @click="
                  () => {
                    if (!isEditMode) resetArtwork(true)
                    triggerFilePicker(index)
                  }
                "
              >
                <v-icon :icon="mdiBrush" />
              </v-btn>
              <v-btn
                class="description-edit-btn"
                v-if="!isCreatingNew && isEditMode && stagedFilePresent(category)"
                icon
                @click="undoStageFileDelete(category)"
              >
                <v-icon :icon="mdiUndo" />
              </v-btn>
            </div>
          </v-tabs-window-item>
        </v-tabs-window>

        <v-divider class="mb-4" />

        <!-- Edit Mode -->
        <template v-if="isEditMode && editState.artwork">
          <div class="description-edit-container mb-4">
            <v-btn
              v-if="!isCreatingNew"
              @click="resetArtwork(false)"
              class="flip-horizontal description-edit-btn opacity-70"
              :icon="mdiLocationExit"
            />
            <v-btn
              v-if="!isCreatingNew"
              @click="deleteArtwork"
              class="description-edit-btn opacity-70"
              :icon="mdiDeleteForever"
            />
            <v-btn
              v-if="isEditMode"
              icon
              class="description-edit-btn opacity-70"
              :disabled="!isModifiedArtwork"
              @click="commitArtworkUpdate"
            >
              <v-icon
                :icon="computed(() => (isCreatingNew ? mdiUpload : mdiCheckBold)).value"
                class="update-icon-btn"
              />
            </v-btn>
          </div>
          <v-text-field v-model="editState.artwork.title" label="Title" />

          <v-autocomplete
            v-model="editState.artwork.style"
            :items="filterdb.styles"
            item-title="label"
            item-value="value"
            label="Style"
          />
          <v-autocomplete
            v-model="editState.artwork.genre"
            :items="filterdb.genres"
            item-title="label"
            item-value="value"
            label="Genre"
          />
          <v-autocomplete
            v-model="editState.artwork.media"
            :items="filterdb.media"
            item-title="label"
            item-value="value"
            label="Media"
          />

          <v-row class="align-top justify-center" dense>
            <v-col cols="3">
              <v-text-field
                v-model="editState.artwork.parameters.w"
                placeholder="W(cm)"
                type="number"
                @input="aspectLockSize(editState.artwork.parameters.w)"
              />
            </v-col>
            <v-col cols="1" class="justify-center">
              <v-btn
                icon
                variant="text"
                @click="
                  () => {
                    aspectLocked = !aspectLocked
                    if (aspectLocked) aspectLockSize(editState.artwork.parameters.w)
                  }
                "
              >
                <v-icon :icon="aspectLocked ? mdiLink : mdiLinkOff" />
              </v-btn>
            </v-col>
            <v-col cols="3">
              <v-text-field
                v-model="editState.artwork.parameters.h"
                placeholder="H(cm)"
                type="number"
                @input="aspectLockSize(editState.artwork.parameters.h)"
              />
            </v-col>
          </v-row>
          <v-date-input label="Created" v-model="createdAtProxy"></v-date-input>

          <v-textarea v-model="editState.artwork.description" label="Description" rows="3" />

          <v-text-field
            v-model="editState.artwork.soundtracks.side_a"
            label="A-side"
            :prepend-inner-icon="mdiSoundcloud"
            :append-inner-icon="mdiAlbum"
          />
          <v-text-field
            v-model="editState.artwork.soundtracks.side_b"
            label="B-side"
            :prepend-inner-icon="mdiSoundcloud"
            :append-inner-icon="mdiAlbum"
          />
          <v-switch v-model="editState.artwork.visible" color="black" label="Visible" />
        </template>

        <!-- View Mode -->

        <template v-else>
          <div class="description-container">
            <div class="text-subtitle-2 font-weight-medium mb-2">{{ artwork.title }}</div>
            <div class="text-caption">Style: {{ artwork.style }}</div>
            <div class="text-caption">Genre: {{ artwork.genre }}</div>
            <div class="text-caption">Media: {{ artwork.media }}</div>
            <div class="text-caption">
              Created At: {{ new Date(artwork.uploaded_at).toLocaleDateString() }}
            </div>
            <div v-if="artwork.description" class="text-caption">
              Description: {{ artwork.description }}
            </div>
            <div v-if="artwork.soundtracks?.side_a" class="text-caption">
              Soundtrack: {{ artwork.soundtracks }}
            </div>
          </div>
        </template>
      </div>
    </v-card>
  </v-col>
</template>

<style scoped>
.artwork-panel {
  height: 82vh;
  display: flex;
  flex-direction: column;
}

.v-tab {
  font-size: clamp(0.5rem, 2vw, 0.9rem);
  white-space: nowrap;
}

.scroll-area {
  overflow-y: auto;
  flex: 1;
  max-height: calc(76vh - 48px);
}

.image-viewer-overlay {
  position: relative;
  width: 100%;
  height: 100%;
  backdrop-filter: blur(10px);
  background-color: rgba(0, 0, 0, 0.4); /* subtle dark overlay */
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: zoom-out;
}

.fullscreen-img {
  object-fit: contain;
  box-shadow: 0 30px 30px rgba(0, 0, 0, 0);
}

.scroll-area::-webkit-scrollbar {
  display: none;
}

.scroll-area {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* Smooth enter/leave */
.fade-expand-enter-active,
.fade-expand-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}

.fade-expand-enter-from,
.fade-expand-leave-to {
  opacity: 0;
  transform: scaleX(0.8);
  transform-origin: left;
}

.avatar-card {
  cursor: pointer;
  padding: 0rem;
}

.flip-horizontal {
  transform: scaleX(-1);
}

.image-wrapper {
  height: 45vh;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.artwork-img {
  max-width: calc(100%); /* leaves space on left/right */
  max-height: 100%;
  height: auto;
  width: auto;
  object-fit: contain;
  transition: transform 0.8s ease;
}

.image-wrapper:hover .artwork-img {
  transform: scale(1.03);
}

.image-buttons {
  display: flex;
  justify-content: center;
  align-items: center;
  transition: opacity 0.25s ease;
  z-index: 1;
  gap: 20px; /* this will work now */
}

/* Individual button styling */
.description-edit-btn {
  backdrop-filter: blur(4px);
  background: rgba(180, 180, 180, 0.4);
  border-radius: 50%;
  font-weight: bold;
  width: 48px;
  height: 48px;
}

.image-wrapper:hover .image-buttons {
  opacity: 0.7;
  pointer-events: auto;
}

.icon-container {
  position: relative;
  display: inline-block;
}

/* Container holding multiple description buttons */
.description-edit-container {
  display: flex;
  justify-content: center;
  align-items: center;
  transition: opacity 0.25s ease;
  z-index: 1;
  gap: 20px; /* this will work now */
}

.description-edit-btn.v-btn {
  backdrop-filter: blur(4px);
  background: rgba(180, 180, 180, 0.4);
  border-radius: 50%;
  font-weight: bold;
  width: 48px;
  height: 48px;
}

.description-container {
  position: relative;
  transition: transform 0.25s ease;
  margin-top: 1rem;
  text-align: center;
}

.description-container:hover {
  transform: scale(1.01);
}

.description-container:hover .description-edit-btn {
  opacity: 0.7;
}

.update-icon-btn {
  color: rgba(76, 175, 80, 0.82); /* medium bright green */
}
</style>
