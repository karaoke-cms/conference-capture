<script setup lang="ts">
const { dashboard } = useOrganizerDashboard();

definePageMeta({ layout: "organizer" });
useHead({ title: "Session QR codes · Organizer" });
</script>
<template>
  <section v-if="dashboard">
    <div class="section-heading"><p class="eyebrow">Participant access</p><h2 class="display">Session QR codes</h2></div>
    <SessionQrPrintList :sessions="dashboard.sessions" :tracks="dashboard.tracks" />
  </section>
</template>
<style scoped>
section { padding: clamp(3.5rem, 8vw, 7rem) 0 0; }
.section-heading { margin-bottom: 1.5rem; }
h2 { max-width: 14ch; margin: 0; font-size: clamp(2.4rem, 6vw, 5.5rem); line-height: .87; }
</style>
