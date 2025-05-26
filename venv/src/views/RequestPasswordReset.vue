<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import type { ResetPasswordRequestPayload } from '@/types/auth'
import { useRouter } from 'vue-router'
import { requiredRule, emailRule } from '@/utils/validation.ts'
import { mdiLogin } from '@mdi/js'

const authStore = useAuthStore()
const router = useRouter()
const resetSent = ref(false)
const valid = ref(false)
const credentials = ref<ResetPasswordRequestPayload>({
  email: '',
})

const reset_password = async () => {
  await authStore.requestPasswordReset(credentials.value)
  if (authStore.statusCode === 200) {
    resetSent.value = true // Hide the card and show message
  }
}
// Function to clear the error when input changes
const clearError = (field: string) => {
  authStore.errors[field] = '' // Remove the error message
  authStore.message = ''
}
</script>

<template>
  <v-container class="d-flex justify-center align-center" style="min-height: 100vh">
    <transition name="fade" mode="out-in">
      <template v-if="!resetSent">
        <v-card class="pa-6" width="400">
          <v-card-title class="d-flex justify-center">RESET</v-card-title>
          <v-card-text>
            <v-form v-model="valid">
              <v-text-field
                v-model="credentials.email"
                label="EMAIL"
                outlined
                required
                autocomplete="email"
                :rules="[requiredRule, emailRule]"
                :error-messages="authStore.errors.email"
                @update:modelValue="clearError('email')"
              />
            </v-form>

            <v-btn
              :disabled="!valid"
              @click="reset_password"
              :loading="authStore.loading"
              :icon="mdiLogin"
              />
            <p v-if="authStore.errors" class="text-error">{{ authStore.errors.error || '' }}</p>
          </v-card-text>
          <v-card-actions class="d-flex flex-column align-start">
            <router-link to="/login">Password retrieved? Log in</router-link>
            <router-link to="/signup">Don't have an account? Sign up</router-link>
          </v-card-actions>
        </v-card>
      </template>

      <!-- Success message appears when resetSent is true -->
      <template v-else>
        <div class="success-msg text-center">
          <v-card class="pa-6" width="400">
            <h3>Password reset link sent to: {{ credentials.email }}</h3>
            <h3>Please check your email</h3>
          </v-card>
        </div>
      </template>
    </transition>
  </v-container>
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
