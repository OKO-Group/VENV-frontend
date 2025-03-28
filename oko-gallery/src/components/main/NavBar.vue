<script setup lang="ts">
import {ref, watchEffect, computed} from 'vue';
import {useRoute, useRouter} from 'vue-router';
import {useAuthStore} from '@/stores/auth.ts';


const route = useRoute();
const router = useRouter();

const isHome = ref(false)
const isLoaded = ref(false); // Controls the initial opacity
const isFirstLoading = ref(false);
const logoutDialog = ref(false); // Controls the logout confirmation dialog
const authStore = useAuthStore();

const isLoggedIn = computed(() => !!authStore.user);
const isApproved = computed(() => authStore.user?.is_approved === true);


// Watch for route changes and update state
watchEffect(() => {
  const fromHome = isHome.value;
  isHome.value = route.path === '/';

  if (isFirstLoading.value || fromHome !== isHome.value) {
    isLoaded.value = false;
    setTimeout(() => {
      isLoaded.value = true;
    }, 10);
  }
  // Mark first load as completed after the first transition
  isFirstLoading.value = false;
});

// Handle logout
const confirmLogout = async () => {
  await authStore.logout();
  logoutDialog.value = false;
  await router.push('/'); // Redirect to home after logout
};

</script>


<template>
  <transition name="nav-transition" mode="out-in">
    <nav :class="{ home: isHome, cornered: !isHome }"
         v-if="isLoaded" :key="isHome"
    >
      <RouterLink to="/" exact-active-class="active">HOME</RouterLink>
      <RouterLink to="/explore" exact-active-class="active">EXPLORE</RouterLink>
      <RouterLink to="/find" exact-active-class="active">SEARCH</RouterLink>
      <RouterLink to="/about" exact-active-class="active">ABOUT</RouterLink>
    </nav>
  </transition>

  <div class="user-menu">
    <v-menu
      offset-y
      transition="scale-transition"
      :location="'bottom center'"
      attach
      open-on-hover
    >
      <template v-slot:activator="{ props }">
        <v-btn v-bind="props" icon class="user-menu-button">
          <v-avatar image="favicon.ico"> </v-avatar> </v-btn>
      </template>
      <v-list class="user-dropdown">
        <v-list-item v-if="!isLoggedIn" @click="router.push('/login')">
          <v-list-item-title>LOGIN</v-list-item-title>
        </v-list-item>
        <v-list-item v-if="!isLoggedIn" @click="router.push('/signup')">
          <v-list-item-title>APPLY</v-list-item-title>
        </v-list-item>
        <v-list-item v-if="isApproved" @click="router.push('/studio')">
          <v-list-item-title>STUDIO</v-list-item-title>
        </v-list-item>
        <v-list-item v-if="isLoggedIn" @click="logoutDialog = true">
          <v-list-item-title>LOGOUT</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
  </div>
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

</template>

<style scoped>
/* Base navigation styles */

nav {
  position: fixed;
  gap: 1rem;
  font-size: 2rem;
  transition: opacity 0.5s ease-in-out;
}

/* Home page: centered vertical navigation */
.home {
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  display: flex;
  flex-direction: column;
}

/* Other pages: top-left horizontal navigation */
.cornered {
  top: 1rem;
  left: 1rem;
  transform: none;
  text-align: left;
  display: flex;
  flex-direction: row;
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
  overflow: hidden;
}

/* Ensure the underline is always there but starts at width 0 */
nav a::after {
  content: '';
  position: absolute;
  bottom: 0; /* Make sure it aligns to the bottom */
  left: 50%;
  width: 0%;
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
  z-index: 100;
  position: fixed;
  top: 1rem;
  right: 3rem;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
}

/* Center the button */
.user-menu-button {
  display: flex;
  justify-content: center;
  align-items: center;
}

/* Center the dropdown menu under the button */
.v-menu__content {
  left: 50% !important;
  transform: translateX(-50%) !important;
}
</style>
