<script setup lang="ts">
import StandardPage from '@/components/main/StandardPage.vue'
import VENV from '@/components/main/VENV.vue'
</script>

<template>
  <StandardPage>
    <v-container class="py-10">
      <VENV location="about" :close-hint="false" />

      <v-card class="pa-1 mx-auto about-card">
        <v-card-text class="text-body-1">
          <p class="mt-4 text-center" >
            At its core, <i>VENV</i> begins as a fine art database, a social graph for art, culture, and media—
            and an idling screensaver.
          </p>

          <p class="paragraph mt-4" >
            Account holders enjoy full control over their artworks and visibility. Membership is
            application-based, intentionally designed to grow gradually and mindfully—preserving
            the integrity and alignment of the community.
          </p>

          <p class="paragraph mt-4">
             However, anyone already included in the public social graph
             is automatically considered part of the community and anyone can explore the platform and its public content.
             If you wish to have your account removed, please contact us. The graph was designed as a public data visualisation tool
             with purpose to connect organizations and users involved in art or science, who are either interested in exposure or don't mind it.
          </p>

          <p class="paragraph mt-2">
            <i>N.B.</i> VENV.co is <strong>not</strong> a marketplace, and it will never support any form of monetization
            beyond donations to cover hosting and maintenance costs. For now, we encourage you to support
            those in more urgent need.
          </p>

          <p class="mt-4 paragraph">
            This platform is an open canvas. While its current purpose is rooted in fine
            art, future directions may include broader creative and cultural endeavors—
            shaped by the wishes of the community and the capabilities of its developers.
          </p>

          <p class="mt-8 text-center">
            Amitié,<br />
            <i>ODRADEQ</i>
          </p>
        </v-card-text>
      </v-card>

      <div class="support-flags mt-8">
        <a href="https://linktr.ee/thesameerproject" target="_blank" rel="noopener" aria-label="Support Palestine">
          <img src="https://upload.wikimedia.org/wikipedia/commons/0/00/Flag_of_Palestine.svg" alt="Palestinian Flag" class="flag" width="120"/>
        </a>
        <a href="https://u24.gov.ua/" target="_blank" rel="noopener" aria-label="Support Ukraine">
          <img src="https://upload.wikimedia.org/wikipedia/commons/4/49/Flag_of_Ukraine.svg" alt="Ukrainian Flag" class="flag" width="88" />
        </a>
      </div>
    </v-container>
  </StandardPage>
</template>

<style scoped>
.about-card {
  backdrop-filter: blur(5px);
}
.paragraph{
  text-indent: 1.5rem; /* or any spacing unit you want */
}
/* Support flags layout */
.support-flags {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 2rem;
  margin-top: 2rem;
}

.flag {
  height: auto;
  border-radius: 1px;
  transition: transform 0.88s ease;
}
.flag:hover {
  transform: scale(1.05);
}
</style>
