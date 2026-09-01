<script setup lang="ts">
const { token, dashboard, error, loading, restoreToken, load } = useOrganizerDashboard();
const route = useRoute();

definePageMeta({ layout: "organizer" });
useHead({ title: "Organizer · Metaphorum Sensemaking" });

// Only ever hand control back to an internal organizer path.
const next = computed(() => {
  const value = typeof route.query.next === "string" ? route.query.next : "";
  return value.startsWith("/organizer") && !value.startsWith("//") ? value : "";
});

async function open() {
  await load();
  if (dashboard.value && next.value) await navigateTo(next.value);
}

onMounted(() => { restoreToken(); if (token.value) open(); });
</script>
<template>
  <form v-if="!dashboard" class="gate" @submit.prevent="open">
    <p class="eyebrow">Protected view</p><h2 class="display">Enter the organizer token.</h2>
    <label><span>Organizer token</span><input v-model="token" type="password" autocomplete="current-password" required /></label>
    <button type="submit" :disabled="loading">{{ loading ? "Opening…" : "Open dashboard" }}</button>
    <p v-if="error" role="alert">{{ error }}</p>
  </form>
  <p v-else class="hint">Dashboard loaded. Choose a section above.</p>
</template>
<style scoped>
.gate { display: grid; max-width: 32rem; gap: 1.2rem; margin: 14vh auto; padding: 2rem; border: 1px solid var(--rule); background: rgb(255 255 255 / 35%); }
.gate h2 { margin: 0; font-size: 2.5rem; line-height: 1; }
.gate label { display: grid; gap: .5rem; font-weight: 700; }
.gate input { min-height: 48px; padding: .7rem; border: 1px solid var(--rule); background: white; }
.gate button { color: white; background: var(--ink); }
.hint { padding: clamp(3.5rem, 8vw, 7rem) 0 0; color: var(--muted); }
</style>
