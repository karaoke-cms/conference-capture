<script setup lang="ts">
import type { Conference, Session, Track } from "@conference/contracts";
const route = useRoute();
const config = useRuntimeConfig();
const { data, error } = await useFetch<{ conference: Conference; track: Track; session: Session }>(`${config.public.apiBase}/api/sessions/${route.params.slug}`);
if (error.value) throw createError({ statusCode: 404, statusMessage: "Session not found" });
useHead({ title: () => data.value ? `${data.value.session.title} · Metaphorum 2026` : "Session" });
const time = computed(() => data.value?.session.startsAt
  ? new Intl.DateTimeFormat("en-GB", { weekday: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(data.value.session.startsAt))
  : "Schedule to be confirmed");
</script>
<template>
  <main v-if="data">
    <SessionHeader :conference="data.conference.title" :track="data.track.title" :title="data.session.title" :description="data.session.description" :time="time" />
    <section>
      <div class="prompt"><p class="eyebrow">Add your signal</p><h2 class="display">What should this session remember?</h2><p>Your view can be partial, surprising, unresolved, or urgent.</p></div>
      <ContributionForm :session-id="data.session.id" />
    </section>
  </main>
</template>
<style scoped>
main { max-width: 66rem; min-height: 100dvh; margin: auto; padding: clamp(1.25rem, 5vw, 4rem); }
section { display: grid; grid-template-columns: minmax(12rem, .75fr) minmax(18rem, 1.25fr); gap: clamp(2rem, 7vw, 7rem); padding: clamp(3rem, 8vw, 7rem) 0; }
.prompt { align-self: start; position: sticky; top: 2rem; }
h2 { margin: .6rem 0 1rem; font-size: clamp(2rem, 5vw, 4rem); line-height: .92; }
.prompt > p:last-child { color: var(--muted); line-height: 1.6; }
@media (max-width: 46rem) { section { grid-template-columns: 1fr; } .prompt { position: static; } }
</style>
