<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useAuthStore } from '@/stores/auth.ts'
import { MFAMethod } from '@/types/auth.ts'

const authStore = useAuthStore()

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'modeChange', mode: MFAMethod): void
}>()

const mode = ref<MFAMethod>(authStore.hasTOTP ? MFAMethod.TOTP : MFAMethod.PASSWORD)

watch(mode, (newMode) => emit('modeChange', newMode))

// Writable v-model
const inputValue = computed({
  get: () => props.modelValue,
  set: (val: string) => emit('update:modelValue', val),
})

// Switching between password and TOTP modes
const toggleMode = () => {
  mode.value = mode.value === MFAMethod.TOTP ? MFAMethod.PASSWORD : MFAMethod.TOTP
  inputValue.value = ''
}

const requiredRule = (v: string) =>
  !!v || `${mode.value === MFAMethod.PASSWORD ? 'Password' : 'Code'} is required`
</script>

<template>
  <div>
    <p class="mb-2">
      2FA action confirmation requires re-authentication.<br />
      You may use your <strong>{{ mode === MFAMethod.TOTP ? 'TOTP code' : 'password' }}</strong
      >.
    </p>

    <v-text-field
      v-if="mode === MFAMethod.PASSWORD"
      v-model="inputValue"
      :label="'PASSWORD'"
      :type="'password'"
      outlined
      required
      autocomplete="off"
      :rules="[requiredRule]"
      :error-messages="authStore.errors.password"
    />
    <v-otp-input
      v-else
      v-model="inputValue"
      :length="6"
      outlined
      required
      autofocus
      :rules="[requiredRule]"
      :error="'code' in authStore.errors"
    >
    </v-otp-input>
    <v-btn v-if="authStore.hasTOTP" variant="text" size="small" class="mt-2" @click="toggleMode">
      Use {{ mode === MFAMethod.PASSWORD ? 'TOTP code' : 'Password' }} instead
    </v-btn>
  </div>
</template>
