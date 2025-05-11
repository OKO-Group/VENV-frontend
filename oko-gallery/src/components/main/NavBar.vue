<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.ts'
import { useArtworkStore } from '@/stores/artworks.ts'
import {
  mdiAccount,
  mdiAccountGroup,
  mdiDomain,
  mdiEyeOutline,
  mdiFormTextbox, mdiInformation,
  mdiLogin,
  mdiLogout,
  mdiSearchWeb, mdiCompass
} from '@mdi/js'
import { useMediaQuery } from '@vueuse/core'


const route = useRoute()
const router = useRouter()

const isHome = ref(false)
const isLoaded = ref(false) // Controls the initial opacity
const isFirstLoading = ref(false)
const logoutDialog = ref(false) // Controls the logout confirmation dialog
const authStore = useAuthStore()
const artworkStore = useArtworkStore()

const isLoggedIn = computed(() => !!authStore.user)
const isApproved = computed(() => authStore.user?.is_approved === true)

const isMobile = useMediaQuery('(max-width: 768px)')

// Watch for route changes and update state
watchEffect(() => {
  const fromHome = isHome.value
  isHome.value = route.path === '/'

  if (isFirstLoading.value || fromHome !== isHome.value) {
    isLoaded.value = false
    setTimeout(() => {
      isLoaded.value = true
    }, 10)
  }
  // Mark first load as completed after the first transition
  isFirstLoading.value = false
})

// Handle logout
const confirmLogout = async () => {
  await authStore.logout()
  logoutDialog.value = false
  await router.push('/') // Redirect to home after logout
}

const avatarSrc = computed(() => {
    const pic = authStore.user?.profile_picture
    return (pic && 'file_thumbnail' in pic ? pic.file_thumbnail : null) || undefined
  }
)
const searchInput = ref()

function focusInput() {
  const el = searchInput.value?.$el?.querySelector('input')
  if (el) el.focus()
}

</script>
<template>
  <v-row>
    <v-col cols="2" md="3">
      <RouterLink to="/" exact-active-class="active">
        <v-icon
          :icon="mdiEyeOutline"
          class="top-left-icon cursor-pointer"
          :style="{position: isMobile? 'absolute' : 'fixed',
          top: isMobile ? 0 : '1rem'}"
        />
      </RouterLink>

    </v-col>
    <v-col cols="12" md="6" class="d-flex flex-column align-center mt-1">
      <transition name="nav-transition" mode="out-in">
        <nav :class="{ home: isHome, cornered: !isHome}"
             :style="{
    position: 'fixed',
    marginTop: isMobile && !isHome ? '0rem' : '',
    top: isMobile && !isHome ? '4rem' : '',
    left: !isMobile && !isHome ? '6rem' : ''}"
             v-if="isLoaded" :key="isHome">
          <!-- Explore -->
          <v-tooltip v-if="!isMobile" text="Explore" :location="isHome ? 'right' : 'bottom'">
            <template #activator="{ props }">
              <RouterLink to="/explore" exact-active-class="active" v-bind="props">
                <v-icon :icon="mdiCompass" size="50" />
              </RouterLink>
            </template>
          </v-tooltip>
          <RouterLink v-else to="/explore" exact-active-class="active">
            <span>EXPLORE</span>
          </RouterLink>

          <!-- Artists -->
          <v-tooltip v-if="!isMobile" text="Artists" :location="isHome ? 'right' : 'bottom'">
            <template #activator="{ props }">
              <RouterLink to="/artists" exact-active-class="active" v-bind="props">
                <v-icon :icon="mdiAccountGroup" size="50" />
              </RouterLink>
            </template>
          </v-tooltip>
          <RouterLink v-else to="/artists" exact-active-class="active">
            <span>ARTISTS</span>
          </RouterLink>

          <!-- About -->
          <v-tooltip v-if="!isMobile" text="About" :location="isHome ? 'right' : 'bottom'">
            <template #activator="{ props }">
              <RouterLink to="/about" exact-active-class="active" v-bind="props">
                <v-icon :icon="mdiInformation" size="50" />
              </RouterLink>
            </template>
          </v-tooltip>
          <RouterLink v-else to="/about" exact-active-class="active">
            <span>ABOUT</span>
          </RouterLink>

        </nav>
      </transition>
    </v-col>

    <v-col class="d-flex flex-column align-center mt-4" md="6">
      <div class="search-wrapper">
        <v-text-field
          v-model="artworkStore.search"
          class="mx-auto align-content-center align-center"
          style="width: 33vw; opacity: 0.5;"
          placeholder="SEARCH"
          @mouseenter="focusInput"
          @keyup.enter="() => router.push('/search')"
        >
          <template #append-inner>
            <v-icon
              :icon="mdiSearchWeb"
              class="clickable-icon"
              @click="() => router.push('/search')"
            />
          </template>
        </v-text-field>
      </div>
    </v-col>
    <v-col cols="1" md="6">
      <div class="user-menu">
        <v-menu
          class="user-menu-content"
          offset-y
          transition="scale-transition"
          :location="'bottom center'"
          attach>
          <template v-slot:activator="{ props }">
            <v-btn v-bind="props" icon class="user-menu-button" variant="text">
              <v-avatar v-if="avatarSrc" :image="avatarSrc"></v-avatar>
              <v-icon v-else :icon="mdiAccount"/>
            </v-btn>
          </template>
          <v-list class="user-dropdown" density="compact">
            <v-list-item v-if="!isLoggedIn" @click="router.push('/login')">
              <v-list-item-title>
                <v-icon :icon="mdiLogin" class="tight-icon" />
                LOGIN
              </v-list-item-title>
            </v-list-item>
            <v-list-item v-if="!isLoggedIn" @click="router.push('/signup')">
              <v-list-item-title>
                <v-icon :icon="mdiFormTextbox" class="tight-icon" />
                APPLY
              </v-list-item-title>
            </v-list-item>
            <v-list-item v-if="isApproved" @click="router.push('/studio')">
              <v-list-item-title>
                <v-icon :icon="mdiDomain" class="tight-icon" />
                STUDIO
              </v-list-item-title>
            </v-list-item>
            <v-list-item v-if="isLoggedIn" @click="logoutDialog = true">
              <v-list-item-title>
                <v-icon :icon="mdiLogout" class="tight-icon" />
                LOGOUT
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </div>
    </v-col>
    <!-- Logout Confirmation Dialog -->
    <v-dialog v-model="logoutDialog" max-width="400px">
      <v-card>
        <v-card-title>Confirm Logout</v-card-title>
        <v-card-text>Are you sure you want to log out?</v-card-text>
        <v-card-actions>
          <v-btn text="" @click="logoutDialog = false">Cancel</v-btn>
          <v-btn color="red" text="" @click="confirmLogout">Log Out</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-row>
</template>

<style scoped>
/* Base navigation styles */
.search-wrapper {
  position: absolute;
  top: 2vh;
  left: 50%;
  transform: translateX(-50%);
  z-index: 101;
}

nav {
  font-size: clamp(0.7rem, 5vw, 1.8rem); /* responsive font scaling */
  transition: opacity 0.5s ease-in-out;
}

.top-left-icon {
  position: absolute;
  font-size: 65px;
  left: 1.5rem;
  color: #ffffff;
  z-index: 1000;
}

/* Home page: centered vertical navigation */
.home {
  position: absolute;
  top: 65%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  display: flex;
  flex-direction: column;
  z-index: 100;
}

/* Other pages: top-left horizontal navigation */
.cornered {
  top: 1rem;
  transform: none;
  display: flex;
  flex-direction: row;
  z-index: 100;
}

/* Fade In/Out Animation */
.nav-transition-enter-active, .nav-transition-leave-active {
  transition: opacity 0.5s ease-in-out;
}

.nav-transition-enter-from, .nav-transition-leave-to {
  opacity: 0;
}

/* Link styles */
nav a {
  text-decoration: none;
  color: white;
  padding: 0.5rem 1rem;
  position: relative;
  overflow: auto;
}

/* Ensure the underline is always there but starts at width 0 */
nav a::after {
  content: '';
  position: absolute;
  bottom: 0; /* Make sure it aligns to the bottom */
  left: 50%;
  width: 0;
  height: 2px;
  background-color: white;
  transition: width 0.3s ease-in-out, left 0.3s ease-in-out;
}

/* When active, the underline smoothly expands */
nav a.active::after {
  width: 100%;
  left: 0;
}

/* User Menu (Top Right) */
.user-menu {
  position: fixed;
  z-index: 1000;
  top: 0.5rem;
  right: 2rem;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  text-align: left;
}
.user-menu-content {
  opacity: 0.7;
  background-color: rgba(1, 1, 1, 0)
}

/* Center the button */
.user-menu-button {
  display: flex;
  justify-content: center;
  align-items: center;
}

.tight-icon {
  font-size: 18px;
}

.user-dropdown {
  text-align: left;
  opacity: 0.95;
}

.user-dropdown .v-list-item-title {
  font-size: 16px;
  font-weight: 500;
}
</style>
