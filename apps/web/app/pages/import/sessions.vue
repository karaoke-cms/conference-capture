<script setup lang="ts">
const { dashboard, importSessions } = useOrganizerDashboard();

definePageMeta({ layout: "organizer" });
useHead({ title: "Import sessions · Organizer" });

const busy = ref(false);
const failure = ref("");
const result = ref<{ tracks: number; sessions: number; scheduled: number; removedDemoSessions: number } | undefined>();

async function run() {
  busy.value = true; failure.value = ""; result.value = undefined;
  try { result.value = await importSessions(); }
  catch (cause) { failure.value = cause instanceof Error ? cause.message : "The sessions could not be imported."; }
  finally { busy.value = false; }
}
</script>
<template>
  <section v-if="dashboard">
    <div class="section-heading"><p class="eyebrow">Programme</p><h2 class="display">Import sessions</h2></div>
    <p class="lede">Writes the Metaphorum programme shipped with this build into the database — tracks, sessions, and their scheduled times. Existing sessions are updated in place, so contributions are kept.</p>
    <button type="button" :disabled="busy" @click="run">{{ busy ? "Importing…" : "Import sessions" }}</button>
    <p v-if="result" class="confirmation" role="status">
      Imported {{ result.sessions }} session{{ result.sessions === 1 ? "" : "s" }} across {{ result.tracks }} track{{ result.tracks === 1 ? "" : "s" }},
      {{ result.scheduled }} of them with a scheduled start time.<template v-if="result.removedDemoSessions"> Removed {{ result.removedDemoSessions }} unused demo session{{ result.removedDemoSessions === 1 ? "" : "s" }}.</template>
    </p>
    <p v-if="failure" class="failure" role="alert">{{ failure }}</p>
  </section>
</template>
<style scoped>
section { display: grid; gap: 1.2rem; justify-items: start; padding: clamp(3.5rem, 8vw, 7rem) 0 0; }
.section-heading { margin-bottom: .3rem; }
h2 { max-width: 14ch; margin: 0; font-size: clamp(2.4rem, 6vw, 5.5rem); line-height: .87; }
.lede { max-width: 46ch; margin: 0; font-family: Charter, serif; font-size: 1.1rem; line-height: 1.5; }
button { min-height: 48px; padding: .7rem 1.1rem; border: 1px solid var(--ink); color: white; background: var(--ink); font-weight: 750; cursor: pointer; }
button:disabled { opacity: .5; cursor: default; }
.confirmation, .failure { max-width: 52ch; margin: 0; padding: .9rem 1rem; border: 1px solid var(--rule); font-size: .85rem; font-weight: 700; }
.confirmation { border-color: color-mix(in srgb, var(--moss) 45%, transparent); color: var(--moss); }
.failure { color: white; background: #9b2412; }
</style>
