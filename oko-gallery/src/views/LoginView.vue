<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import type { LoginPayload } from '@/types/auth'
import { useRouter } from 'vue-router'
import { requiredRule, emailRule } from '@/utils/validation.ts'
import { HttpStatusCode } from 'axios'
import { mdiArrowRight, mdiLogin } from '@mdi/js'

const authStore = useAuthStore()
const router = useRouter()
const valid = ref(false)
const mfa_authenticating = ref(false)
const credentials = ref<LoginPayload>({
  email: '',
  password: ''
})


const login = async () => {
  if (!valid.value) return // Prevent submission if form is invalid
  await authStore.login(credentials.value)
  switch (authStore.statusCode) {
    case HttpStatusCode.Ok:
      await router.push('/')
      credentials.value.password = ''
      break
    case HttpStatusCode.Accepted:
      credentials.value.password = ''
      valid.value = false
      mfa_authenticating.value = true
      break
  }
}

const mfaLogin = async () => {
  await authStore.loginMFA(credentials.value.password)
  if (authStore.statusCode === HttpStatusCode.Ok) {
    credentials.value.password = ''
    await router.push('/')
  }
}

// Function to clear the error when input changes
const clearError = (field: string) => {
  authStore.errors[field] = '' // Remove the error message
  authStore.message = ''
}
</script>

<template>
  <v-container class="login d-flex justify-center align-center" style="min-height: 100vh">
    <v-card>
      <v-card-title class="d-flex justify-center">LOGIN</v-card-title>
      <v-card-text>
        <v-form v-if="!mfa_authenticating" v-model="valid">
          <v-text-field v-model="credentials.email" label="EMAIL" outlined required
                        autocomplete="email"
                        :rules="[requiredRule, emailRule]" @update:modelValue="clearError('email')"
                        :error-messages="authStore.errors.email" />
          <v-text-field v-model="credentials.password" label="PASSWORD" type="password" outlined
                        required autocomplete="password"
                        :rules="[requiredRule]" @update:modelValue="clearError('password')"
                        :error-messages="authStore.errors.password" />
          <v-btn :disabled="!valid" @click="login"
                 :loading="authStore.loading" :icon="mdiLogin">
          </v-btn>
        </v-form>
        <v-form v-else v-model="valid" >
          <p> 2FA CODE </p>
          <v-otp-input v-model="credentials.password" :rules="[requiredRule]"
                       :error-messages="[authStore.errors.error]"
                       :length="6" outlined required autofocus
          />
          <v-btn :icon="mdiLogin" @click="mfaLogin"></v-btn>
        </v-form>
        <p v-if="authStore.errors" class="text-error">{{ authStore.errors.error || '' }}</p>
      </v-card-text>
      <v-card-actions class="d-flex flex-column align-start">
        <router-link to="/signup">Don't have an account? Sign up</router-link>
        <router-link to="/reset">Password forgotten? Reset password</router-link>
      </v-card-actions>
    </v-card>
  </v-container>
</template>

<style scoped>

.login{
  z-index: 100;
}

</style>
