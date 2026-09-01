<script setup lang="ts">
const { dashboard, conference, questions, queued, generate } = useOrganizerDashboard();

definePageMeta({ layout: "organizer" });
useHead({ title: "World Café · Organizer" });
</script>
<template>
  <section v-if="dashboard && conference" class="world-cafe">
    <div class="section-heading"><p class="eyebrow">Collective S5 · Closing inquiry</p><h2 class="display">World Café questions</h2><button type="button" :disabled="queued.has('world-cafe:' + conference.id)" @click="generate('world-cafe', conference.id)">Generate final questions</button></div>
    <QuestionList v-if="questions.length" :questions="questions" /><p v-else class="empty">Generate the conference synthesis first, then create three or four closing questions.</p>
  </section>
</template>
<style scoped>
section { padding: clamp(3.5rem, 8vw, 7rem) 0 0; }
.section-heading { display: grid; grid-template-columns: 1fr auto; gap: .7rem 1rem; align-items: end; margin-bottom: 1.5rem; }
.section-heading .eyebrow { grid-column: 1 / -1; }
h2 { max-width: 14ch; margin: 0; font-size: clamp(2.4rem, 6vw, 5.5rem); line-height: .87; }
button { min-height: 44px; padding: .65rem .9rem; border: 1px solid var(--ink); color: var(--ink); background: transparent; font-weight: 750; cursor: pointer; }
button:disabled { opacity: .5; }
.world-cafe { padding-bottom: 1rem; }
.empty { padding: 2rem; border: 1px dashed var(--rule); color: var(--muted); }
@media (max-width: 34rem) { .section-heading { grid-template-columns: 1fr; } }
</style>
