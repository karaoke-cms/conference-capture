<script setup lang="ts">
import { latestSynthesis } from "../../utils/dashboard";

const { dashboard, queued, generate } = useOrganizerDashboard();

definePageMeta({ layout: "organizer" });
useHead({ title: "Tracks · Organizer" });
</script>
<template>
  <section v-if="dashboard">
    <div class="section-heading"><p class="eyebrow">Recursive level 02</p><h2 class="display">Tracks</h2></div>
    <div class="scope-grid"><ScopePanel v-for="track in dashboard.tracks" :key="track.id" label="Track synthesis" :title="track.title" scope-type="track" :scope-id="track.id" :synthesis="latestSynthesis(dashboard.syntheses, 'track', track.id)" :busy="queued.has('track:' + track.id)" @generate="generate" /></div>
  </section>
</template>
<style scoped>
section { padding: clamp(3.5rem, 8vw, 7rem) 0 0; }
.section-heading { margin-bottom: 1.5rem; }
h2 { max-width: 14ch; margin: 0; font-size: clamp(2.4rem, 6vw, 5.5rem); line-height: .87; }
.scope-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 27rem), 1fr)); gap: .8rem; }
</style>
