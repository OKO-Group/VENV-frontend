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

const authStore = useAuthStore()
const router = useRouter()

const valid = ref(false)
const dialog = ref(false) // Controls the success message dialog
const officialFormDisabled = true // TODO set to true on release
const userData = ref<SignupPayload>({
  username: '',
  email: '',
  password: '',
  password_confirmation: '',
  answer: 'VE',
  portfolio_link: '',
  first_name: '',
  last_name: 'VE',
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
      <div v-if="officialFormDisabled">
        <v-card class="contact-card mx-auto">
          <v-card-text class="text-body-1">
            <div class="text-center mb-6">
              <h2 class="text-h5 font-weight-medium mb-2">Join VENV</h2>
              <p class="mt-2">Artist, scientist or engineer?</p>
              <p>We’d love to hear from you—just drop us an email to apply.</p>
              <p>
                Please include a link to your portfolio or public profile, a brief introduction
                about yourself,
              </p>
              <p>and let us know which role you’d like to fulfill.</p>
              <p class="mt-4 text-medium-emphasis">Warm regards,</p>
              <p class="mt-4 text-medium-emphasis">
                <i>Odradeq Team</i>
              </p>
            </div>

            <v-row justify="center" class="text-center">
              <v-col cols="12" md="8">
                <v-btn
                  variant="outlined"
                  href="mailto:odradeq@venv.co"
                  color="primary"
                  class="mt-2"
                >
                  odradeq@venv.co
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </div>
      <v-card v-else class="venv-card">
        <v-card-title class="venv-title">VENV Application</v-card-title>
        <v-card-text>
          <v-form v-model="valid">
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
              v-model="userData.first_name"
              :rules="[requiredRule, minLengthRule]"
              label="First Name"
              outlined
              required
              :error-messages="authStore.errors.first_name"
              @update:modelValue="clearError('first_name')"
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
            <v-btn
              color="primary"
              block
              @click="signup"
              :loading="authStore.loading"
              :disabled="!valid"
              >Sign Up
            </v-btn>
          </v-form>
          <p v-if="authStore.errors" class="text-error">{{ authStore.errors.error || '' }}</p>
        </v-card-text>
        <v-card-actions>
          <router-link to="/login">Already have an account? Login</router-link>
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

.venv-card {
  background: rgba(220, 219, 219, 0.5) !important;
}

.signup-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 80vh;
  z-index: 100;
}

.venv-title {
  color: hsl(0, 0%, 15%);
}

/* Center the dialog */

/* Fix text alignment issue */
.v-card {
  text-align: center;
}
</style>
