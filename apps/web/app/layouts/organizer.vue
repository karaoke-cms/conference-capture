<script setup lang="ts">
const { token, dashboard, error, loading, restoreToken, load } = useOrganizerDashboard();
const route = useRoute();

onMounted(async () => {
  restoreToken();
  if (!dashboard.value && token.value && !loading.value) await load();
  if (!dashboard.value && route.path !== "/organizer") await navigateTo("/organizer");
});

const sections = [
  { to: "/organizer/contributions", label: "Contributions" },
  { to: "/organizer/sessions", label: "Sessions" },
  { to: "/organizer/tracks", label: "Tracks" },
  { to: "/organizer/conference", label: "Whole conference" },
  { to: "/organizer/world-cafe", label: "World Café" },
  { to: "/organizer/qr-codes", label: "Session QR codes" },
];
</script>
<template>
  <main>
    <header class="masthead"><NuxtLink to="/" class="mark">M<br />26</NuxtLink><div><p class="eyebrow">Organizer console</p><h1 class="display">Conference pulse</h1></div><button v-if="dashboard" type="button" @click="load">Refresh</button></header>
    <nav v-if="dashboard" aria-label="Dashboard sections" class="section-nav">
      <NuxtLink v-for="section in sections" :key="section.to" :to="section.to" class="section-button">{{ section.label }}</NuxtLink>
    </nav>
    <p v-if="error" class="banner" role="alert">{{ error }}</p>
    <slot />
  </main>
</template>
<style scoped>
main { max-width: 90rem; min-height: 100dvh; margin: auto; padding: clamp(1rem, 4vw, 4rem); }
.masthead { display: grid; grid-template-columns: auto 1fr auto; gap: 1rem; align-items: center; padding-bottom: 1.5rem; border-bottom: 1px solid var(--rule); }
.mark { display: grid; width: 3.5rem; height: 3.5rem; place-content: center; border-radius: 50%; color: white; background: var(--ink); font-family: Charter, serif; font-weight: 800; line-height: .85; text-align: center; text-decoration: none; transform: rotate(-5deg); }
h1 { margin: .15rem 0 0; font-size: clamp(2.1rem, 5vw, 4.5rem); line-height: .9; }
button { min-height: 44px; padding: .65rem .9rem; border: 1px solid var(--ink); color: var(--ink); background: transparent; font-weight: 750; cursor: pointer; }
.section-nav { position: sticky; z-index: 2; top: 0; display: flex; flex-wrap: wrap; gap: 1px; margin: 1.5rem 0 0; overflow-x: auto; background: var(--rule); }
.section-button { display: flex; min-width: max-content; min-height: 44px; gap: .6rem; align-items: center; padding: .65rem .85rem; color: var(--ink); background: var(--paper); font-size: .78rem; font-weight: 750; text-decoration: none; }
.section-button.router-link-active { color: white; background: var(--ink); }
.banner { position: sticky; z-index: 3; top: 3.5rem; padding: .8rem; color: white; background: #9b2412; }
@media (max-width: 34rem) { .masthead { grid-template-columns: auto 1fr; } .masthead > button { grid-column: 1 / -1; } }
</style>
