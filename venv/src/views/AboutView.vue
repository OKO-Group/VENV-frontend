<script setup lang="ts">
import StandardPage from '@/components/main/StandardPage.vue'
import VENV from '@/components/main/VENV.vue'
</script>

<template>
    <v-container class="py-10">
      <VENV location="about" :close-hint="false" />

      <v-card class="pa-1 mx-auto about-card">
        <v-card-text class="text-body-1">
          <p class="mt-4 text-center" >
            At its core, <i>VENV</i> begins as a public fine art database, social graph for art, science, culture, and media—
            and lastly - an idling screensaver.
          </p>

          <p class="paragraph mt-4" >
            Account holders enjoy full control over their artworks and visibility. Membership is
            application-based, intentionally designed to grow gradually and mindfully—preserving
            the integrity and alignment of the community.
          </p>

          <p class="paragraph mt-4">
             The social graph was built by carefully selecting public accounts that fit the context of art & science.
             If you wish to have your account removed, please contact us. The graph was designed as a public data visualisation tool
             with purpose to connect organizations and users involved in art or science, who are either interested in exposure or don't mind it.
            We derive no rights or monetary gain from this graph. It's sole purpose is to provide a visual tool and make people aware of how public data can be used.
          </p>

          <p class="paragraph mt-4">
            <i>N.B.</i> <strong>VENV.co</strong> is <strong>NOT</strong> a marketplace, and it will <strong>NEVER</strong> support any form of monetization. Instead, we encourage you to support
            those in more urgent need.
          </p>

          <p class="mt-2 paragraph">
            This platform is an open canvas. While its current purpose is rooted in fine
            art, future directions may include broader creative and cultural endeavors—
            shaped by the wishes of the community and the capabilities of its developers.
          </p>

          <p class="mt-8 text-center">
            Amitié,<br />
            <i>Odradeq</i>
          </p>
        </v-card-text>
      </v-card>

      <div class="support-flags mt-5">
        <a href="https://linktr.ee/thesameerproject" target="_blank" rel="noopener" aria-label="Support Palestine">
          <img src="https://upload.wikimedia.org/wikipedia/commons/0/00/Flag_of_Palestine.svg" alt="Palestinian Flag" class="flag" width="80"/>
        </a>
        <a href="https://u24.gov.ua/" target="_blank" rel="noopener" aria-label="Support Ukraine">
          <img src="https://upload.wikimedia.org/wikipedia/commons/4/49/Flag_of_Ukraine.svg" alt="Ukrainian Flag" class="flag" width="50" />
        </a>
      </div>
    </v-container>
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
