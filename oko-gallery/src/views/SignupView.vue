<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import {
  emailRule,
  minLengthRule,
  passwordMinLengthRule,
  portfolioLinkRule,
  requiredRule,
} from '@/utils/validation.ts'
import type { SignupPayload } from '@/types/auth.ts'
import { useMediaQuery } from '@vueuse/core'

const authStore = useAuthStore()
const router = useRouter()

const valid = ref(false)
const dialog = ref(false) // Controls the success message dialog

const userData = ref<SignupPayload>({
  username: '',
  email: '',
  password: '',
  password_confirmation: '',
  answer: '',
  portfolio_link: '',
  first_name: '',
  last_name: '',
})

const matchPasswordRule = () =>
  userData.value.password === userData.value.password_confirmation || 'Passwords do not match.'

// Function to clear the error when input changes
const clearError = (field: string) => {
  authStore.errors[field] = '' // Remove the error message
  authStore.message = ''
}

// Signup function
const signup = async () => {
  if (!valid.value) return // Prevent submission if form is invalid
  await authStore.signup(userData.value)

  // Show success notification if signup was successful
  if (authStore.statusCode === 401) {
    dialog.value = true // Show the success message dialog
  }
  userData.value.password = ''
  userData.value.password_confirmation = ''
}
// Redirect to home after clicking "OK"
const redirectToHome = () => {
  dialog.value = false
  router.push('/') // Redirect to home
}

</script>

<template>
  <div class="signup-container">
    <v-container class="d-flex justify-center align-center fill-height">
      <v-card class="signup-card">
        <v-card-title>VENV Artist Application</v-card-title>
        <v-card-text>
          <v-form v-model="valid">
            <v-text-field
              v-model="userData.username"
              :rules="[requiredRule, minLengthRule]"
              label="Username"
              outlined
              autocomplete="username"
              required
              :error-messages="authStore.errors.username"
              @update:modelValue="clearError('username')"
            />
            <v-text-field
              v-model="userData.email"
              :rules="[requiredRule, emailRule]"
              label="Email"
              outlined
              required
              :error-messages="authStore.errors.email"
              @update:modelValue="clearError('email')"
            />
            <v-text-field
              v-model="userData.first_name"
              :rules="[requiredRule, minLengthRule]"
              label="First Name"
              outlined
              required
              :error-messages="authStore.errors.first_name"
              @update:modelValue="clearError('first_name')"
            />
            <v-text-field
              v-model="userData.last_name"
              :rules="[requiredRule, minLengthRule]"
              label="Last Name"
              outlined
              required
              :error-messages="authStore.errors.last_name"
              @update:modelValue="clearError('last_name')"
            />
            <v-text-field
              v-model="userData.portfolio_link"
              :rules="[requiredRule, portfolioLinkRule]"
              label="Portfolio Link"
              outlined
              required
              :error-messages="authStore.errors.portfolio_link"
              @update:modelValue="clearError('portfolio_link')"
            />

            <v-text-field
              v-model="userData.password"
              :rules="[requiredRule, passwordMinLengthRule]"
              label="Password"
              type="password"
              autocomplete="new-password"
              outlined
              required
              :error-messages="authStore.errors.password"
              @update:modelValue="clearError('password')"
            />

            <v-text-field
              v-model="userData.password_confirmation"
              :rules="[requiredRule, matchPasswordRule]"
              label="Confirm Password"
              type="password"
              autocomplete="new-password"
              outlined
              required
              :error-messages="authStore.errors.password_confirmation"
              @update:modelValue="clearError('password_confirmation')"
            />
            <v-text-field
              v-model="userData.answer"
              :rules="[requiredRule]"
              label="Why do you create?"
              outlined
              required
              :error-messages="authStore.errors.answer"
              @update:modelValue="clearError('answer')"
            />
            <v-btn
              color="primary"
              block
              @click="signup"
              :loading="authStore.loading"
              :disabled="!valid"
              >Sign Up
            </v-btn>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <router-link to="/login">Already have an VENV account? Login</router-link>
        </v-card-actions>
      </v-card>
    </v-container>
    <!-- Success Notification Dialog -->
    <v-dialog v-model="dialog" max-width="400px" persistent>
      <v-card>
        <v-card-title>Success!</v-card-title>
        <v-card-text>
          {{ authStore.message }}
        </v-card-text>
        <v-card-actions>
          <v-btn color="primary" block @click="redirectToHome">OK</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
/* Ensures full-page centering */
.signup-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 80vh;
  z-index: 100;
}

.signup-card {
}
/* Center the dialog */

/* Fix text alignment issue */
.v-card {
  text-align: center;
}
</style>
