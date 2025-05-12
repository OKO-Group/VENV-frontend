<script setup lang="ts">
import { ref, onBeforeMount } from 'vue'
import { useAuthStore } from '@/stores/auth'
import type { CompletePasswordResetPayload } from '@/types/auth'
import { useRoute } from 'vue-router'
import { requiredRule, passwordMinLengthRule } from '@/utils/validation.ts'
import LandingMessage from '@/components/LandingMessage.vue'

const authStore = useAuthStore()
const route = useRoute()

const resetSent = ref(false)
const valid = ref(false)
const validResetKey = ref(true)
const errorMessage = ref('')

const credentials = ref<CompletePasswordResetPayload>({
  key: '',
  password: '',
  password_confirmation: '',
})

onBeforeMount(async () => {
  const key = Array.isArray(route.params.key) ? route.params.key[0] : route.params.key
  if (!key) {
    validResetKey.value = false
    errorMessage.value = 'Password reset key missing'
  } else {
    await authStore.getPasswordResetInfo(key)
    validResetKey.value = authStore.statusCode === 200
    errorMessage.value = 'Invalid password reset key'
  }
})
// Function to clear the error when input changes
const clearError = (field: string) => {
  authStore.errors[field] = '' // Remove the error message
  authStore.message = ''
}

const reset_password = async () => {
  credentials.value.key = Array.isArray(route.params.key) ? route.params.key[0] : route.params.key
  await authStore.completePasswordRequest(credentials.value)
  if (authStore.statusCode === 200 || authStore.statusCode === 401) {
    resetSent.value = true // Hide the card and show message
  }
  credentials.value = {
    key: '',
    password: '',
    password_confirmation: '',
  }
}

const matchPasswordRule = () =>
  credentials.value.password === credentials.value.password_confirmation ||
  'Passwords do not match.'
</script>

<template>
  <LandingMessage
    v-if="resetSent"
    :success-message="'Password reset successfully!'"
    :redirect-after="5"
    :start-countdown="true"
    :redirect-route="'/login'"
  />

  <LandingMessage
    v-else-if="!validResetKey"
    :error-message="errorMessage"
    :is-error="true"
    :redirect-after="5"
    :start-countdown="true"
  />

  <LandingMessage v-else :show-slot-instead-of-message="true">
    <v-card-title>RESET</v-card-title>
    <v-form v-model="valid">
      <v-text-field
        v-model="credentials.password"
        label="NEW PASSWORD"
        type="password"
        outlined
        required
        autocomplete="new-password"
        :rules="[requiredRule, passwordMinLengthRule]"
        @update:modelValue="clearError('password')"
        :error-messages="authStore.errors.password"
      />
      <v-text-field
        v-model="credentials.password_confirmation"
        label="CONFIRM PASSWORD"
        type="password"
        outlined
        required
        :rules="[requiredRule, matchPasswordRule]"
        @update:modelValue="clearError('password_confirmation')"
      />
      <v-btn :disabled="!valid" color="primary" @click="reset_password">Reset</v-btn>
    </v-form>
  </LandingMessage>
</template>

<style scoped>
/* Fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
