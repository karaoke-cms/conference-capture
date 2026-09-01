<script setup lang="ts">
const { dashboard, sessionTitle } = useOrganizerDashboard();

definePageMeta({ layout: "organizer" });
useHead({ title: "Contributions · Organizer" });

const search = ref("");
const filtered = computed(() => {
  const query = search.value.trim().toLowerCase();
  const items = dashboard.value?.contributions ?? [];
  if (!query) return items;
  return items.filter((item) => sessionTitle(item.sessionId).toLowerCase().includes(query));
});
</script>
<template>
  <section v-if="dashboard">
    <div class="section-heading"><p class="eyebrow">Live material</p><h2 class="display">Participant contributions</h2></div>
    <label class="search"><span>Search by session</span><input v-model="search" type="search" placeholder="Session title…" /></label>
    <div v-if="filtered.length" class="contributions">
      <div v-for="item in filtered" :key="item.id" class="contribution">
        <ContributionCard :contribution="item" />
        <NuxtLink :to="{ path: '/organizer/sessions', hash: `#session-${item.sessionId}` }" class="session-link">{{ sessionTitle(item.sessionId) }} →</NuxtLink>
      </div>
    </div>
    <p v-else class="empty">No contributions match that search.</p>
  </section>
</template>
<style scoped>
section { padding: clamp(3.5rem, 8vw, 7rem) 0 0; }
.section-heading { margin-bottom: 1.5rem; }
h2 { max-width: 14ch; margin: 0; font-size: clamp(2.4rem, 6vw, 5.5rem); line-height: .87; }
.search { display: grid; gap: .4rem; max-width: 24rem; margin-bottom: 1.5rem; font-weight: 700; }
.search input { min-height: 44px; padding: .6rem .8rem; border: 1px solid var(--rule); background: white; }
.contributions { display: grid; grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr)); gap: .8rem; }
.contribution { display: grid; gap: .4rem; }
.session-link { color: var(--moss); font-size: .75rem; font-weight: 750; text-decoration: none; }
.session-link:hover { text-decoration: underline; }
.empty { padding: 2rem; border: 1px dashed var(--rule); color: var(--muted); }
</style>
