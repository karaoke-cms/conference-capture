<script setup lang="ts">
const { dashboard, conference, conferenceSynthesis, queued, generate } = useOrganizerDashboard();

definePageMeta({ layout: "organizer" });
useHead({ title: "Whole conference · Organizer" });
</script>
<template>
  <section v-if="dashboard && conference">
    <div class="section-heading"><p class="eyebrow">Recursive level 03</p><h2 class="display">Whole conference</h2></div>
    <ScopePanel label="Conference synthesis" :title="conference.title" scope-type="conference" :scope-id="conference.id" :synthesis="conferenceSynthesis" :busy="queued.has('conference:' + conference.id)" @generate="generate" />
  </section>
</template>
<style scoped>
section { padding: clamp(3.5rem, 8vw, 7rem) 0 0; }
.section-heading { margin-bottom: 1.5rem; }
h2 { max-width: 14ch; margin: 0; font-size: clamp(2.4rem, 6vw, 5.5rem); line-height: .87; }
</style>
