<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps<{
  successMessage?: string
  errorMessage?: string
  isError?: boolean
  redirectAfter?: number // in seconds
  showSlotInsteadOfMessage?: boolean
  startCountdown?: boolean
  redirectRoute?: string
}>()

const router = useRouter()
const countdown = ref(props.redirectAfter || 5)

onMounted(() => {
  if (!props.startCountdown) return

  const interval = setInterval(() => {
    countdown.value -= 1
    if (countdown.value === 0) {
      clearInterval(interval)
      router.push(props.redirectRoute || '/')
    }
  }, 1000)
})
</script>

<template>
  <div class="landing-msg-wrapper text-center">
    <v-card class="pa-6" width="500">
      <template v-if="showSlotInsteadOfMessage">
        <slot />
      </template>
      <template v-else>
        <h2>{{ isError ? errorMessage : successMessage }}</h2>
        <p>
          You will be automatically redirected in <strong>{{ countdown }}</strong> seconds
        </p>
      </template>
    </v-card>
  </div>
</template>

<style scoped>
.landing-msg-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}
</style>
