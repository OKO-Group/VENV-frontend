<script setup lang="ts">
import {ref, onMounted} from 'vue';
import {useAuthStore} from '@/stores/auth';
import type {
  ConfirmEmailPayload
} from '@/types/auth';
import {useRouter, useRoute} from 'vue-router';
import LandingMessage from '@/components/LandingMessage.vue';
import { HttpStatusCode } from 'axios'


const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();

const emailConfirmed = ref(false);
const validResetKey = ref(false);
const countdown = ref(5);
const credentials = ref<ConfirmEmailPayload>({
  key: '',
});

onMounted(async () => {
  const key = Array.isArray(route.params.key) ? route.params.key[0] : route.params.key;
  if (!key) {
    validResetKey.value = false;
  } else {
    credentials.value.key = key;
    await authStore.verifyEmail(credentials.value);
    validResetKey.value =[HttpStatusCode.Ok, HttpStatusCode.Unauthorized].includes(authStore.statusCode ?? 0) ;
  }
  validResetKey.value || await setCountdown()
})

const setCountdown = async () => {
  const interval = setInterval(() => {
    countdown.value -= 1;
    if (countdown.value == 0) {
      clearInterval(interval);
      router.push('/');
    }
  }, 1000)
}

</script>

<template>
    <LandingMessage
      :success-message="'Your email has been successfully confirmed!'"
      :redirect-after="5"
      v-if="emailConfirmed"
      :start-countdown="true"
    />

    <LandingMessage
      :error-message="'Invalid or expired email confirmation link.'"
      :is-error="true"
      :redirect-after="5"
      :start-countdown="true"
      v-else
    />
</template>


<style scoped>
/* Fade transition */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
