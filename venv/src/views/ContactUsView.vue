<script setup lang="ts">
import StandardPage from '@/components/main/StandardPage.vue'
</script>

<template>
    <v-container class="py-10">
      <v-card class="contact-card mx-auto">
        <v-card-text class="text-body-1">
          <div class="text-center mb-6">
            <h2 class="text-h5 font-weight-medium mb-2">Contact</h2>
            <p class="text-medium-emphasis">
              For inquiries, feedback, or collaborations — feel free to reach out.
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
                mail@venv.co
              </v-btn>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-container>
</template>

<style scoped>
.contact-card {
  max-width: 600px;
  padding: 2rem;
  backdrop-filter: blur(10px);
  background-color: rgba(255, 255, 255, 0.4) !important;
  transition: box-shadow 0.3s ease;
}

.contact-card:hover {
}
</style>
