<script setup lang="ts">
import { latestSynthesis } from "../../utils/dashboard";

const { dashboard, queued, generate } = useOrganizerDashboard();

definePageMeta({ layout: "organizer" });
useHead({ title: "Sessions · Organizer" });

const search = ref("");
const filtered = computed(() => {
  const query = search.value.trim().toLowerCase();
  const items = dashboard.value?.sessions ?? [];
  if (!query) return items;
  return items.filter((session) => session.title.toLowerCase().includes(query));
});
</script>
<template>
  <section v-if="dashboard">
    <div class="section-heading"><p class="eyebrow">Recursive level 01</p><h2 class="display">Sessions</h2></div>
    <label class="search"><span>Search sessions</span><input v-model="search" type="search" placeholder="Session title…" /></label>
    <div v-if="filtered.length" class="scope-grid">
      <ScopePanel v-for="session in filtered" :id="`session-${session.id}`" :key="session.id" label="Session synthesis" :title="session.title" scope-type="session" :scope-id="session.id" :synthesis="latestSynthesis(dashboard.syntheses, 'session', session.id)" :busy="queued.has('session:' + session.id)" @generate="generate" />
    </div>
    <p v-else class="empty">No sessions match that search.</p>
  </section>
</template>
<style scoped>
section { padding: clamp(3.5rem, 8vw, 7rem) 0 0; }
.section-heading { margin-bottom: 1.5rem; }
h2 { max-width: 14ch; margin: 0; font-size: clamp(2.4rem, 6vw, 5.5rem); line-height: .87; }
.search { display: grid; gap: .4rem; max-width: 24rem; margin-bottom: 1.5rem; font-weight: 700; }
.search input { min-height: 44px; padding: .6rem .8rem; border: 1px solid var(--rule); background: white; }
.scope-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 27rem), 1fr)); gap: .8rem; }
.scope-grid > :deep(article) { scroll-margin-top: 5rem; }
.empty { padding: 2rem; border: 1px dashed var(--rule); color: var(--muted); }
</style>
