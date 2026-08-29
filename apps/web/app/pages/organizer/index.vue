<script setup lang="ts">
import type { Conference, Contribution, ProcessingJob, ScopeType, Session, Synthesis, Track } from "@conference/contracts";
import { latestSynthesis } from "../../utils/dashboard";

interface Dashboard { conferences: Conference[]; tracks: Track[]; sessions: Session[]; contributions: Contribution[]; syntheses: Synthesis[]; jobs: ProcessingJob[] }
const config = useRuntimeConfig();
const token = ref("");
const dashboard = ref<Dashboard>();
const error = ref("");
const loading = ref(false);
const queued = ref(new Set<string>());

onMounted(() => { token.value = sessionStorage.getItem("organizer-token") ?? ""; if (token.value) load(); });
useHead({ title: "Organizer · Metaphorum Sensemaking" });

async function load() {
  loading.value = true; error.value = "";
  try {
    const response = await fetch(`${config.public.apiBase}/api/organizer/dashboard`, { headers: { authorization: `Bearer ${token.value}` } });
    if (!response.ok) throw new Error(response.status === 401 ? "That organizer token was not accepted." : "The dashboard could not be loaded.");
    dashboard.value = await response.json();
    sessionStorage.setItem("organizer-token", token.value);
    queued.value = new Set();
  } catch (cause) { error.value = cause instanceof Error ? cause.message : "The dashboard could not be loaded."; }
  finally { loading.value = false; }
}

async function generate(scopeType: ScopeType | "world-cafe", scopeId: string) {
  const key = `${scopeType}:${scopeId}`; queued.value = new Set([...queued.value, key]);
  const previous = dashboard.value ? latestSynthesis(dashboard.value.syntheses, scopeType === "world-cafe" ? "conference" : scopeType, scopeId)?.generatedAt : undefined;
  const response = await fetch(`${config.public.apiBase}/api/organizer/synthesis`, {
    method: "POST", headers: { authorization: `Bearer ${token.value}`, "content-type": "application/json" },
    body: JSON.stringify({ scopeType, scopeId }),
  });
  if (!response.ok) {
    error.value = "The synthesis job could not be queued.";
    queued.value = new Set([...queued.value].filter((item) => item !== key));
    return;
  }
  for (let attempt = 0; attempt < 8; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await load();
    const current = dashboard.value ? latestSynthesis(dashboard.value.syntheses, scopeType === "world-cafe" ? "conference" : scopeType, scopeId)?.generatedAt : undefined;
    if (current && current !== previous) return;
  }
}
const conference = computed(() => dashboard.value?.conferences[0]);
const conferenceSynthesis = computed(() => conference.value && dashboard.value ? latestSynthesis(dashboard.value.syntheses, "conference", conference.value.id) : undefined);
const questions = computed(() => conferenceSynthesis.value?.questions ?? []);
</script>
<template>
  <main>
    <header class="masthead"><NuxtLink to="/" class="mark">M<br />26</NuxtLink><div><p class="eyebrow">Organizer console</p><h1 class="display">Conference pulse</h1></div><button v-if="dashboard" type="button" @click="load">Refresh</button></header>
    <form v-if="!dashboard" class="gate" @submit.prevent="load">
      <p class="eyebrow">Protected view</p><h2 class="display">Enter the organizer token.</h2>
      <label><span>Organizer token</span><input v-model="token" type="password" autocomplete="current-password" required /></label>
      <button type="submit" :disabled="loading">{{ loading ? "Opening…" : "Open dashboard" }}</button>
      <p v-if="error" role="alert">{{ error }}</p>
    </form>
    <template v-else>
      <nav aria-label="Dashboard sections"><a href="#contributions">Contributions <b>{{ dashboard.contributions.length }}</b></a><a href="#sessions">Sessions <b>{{ dashboard.sessions.length }}</b></a><a href="#conference">Conference</a><a href="#world-cafe">World Café</a></nav>
      <p v-if="error" class="banner" role="alert">{{ error }}</p>

      <section id="contributions">
        <div class="section-heading"><p class="eyebrow">Live material</p><h2 class="display">Participant contributions</h2></div>
        <div v-if="dashboard.contributions.length" class="contributions"><ContributionCard v-for="item in dashboard.contributions" :key="item.id" :contribution="item" /></div>
        <p v-else class="empty">No contributions have arrived yet.</p>
      </section>

      <section id="sessions">
        <div class="section-heading"><p class="eyebrow">Recursive level 01</p><h2 class="display">Sessions</h2></div>
        <div class="scope-grid"><ScopePanel v-for="session in dashboard.sessions" :key="session.id" label="Session synthesis" :title="session.title" scope-type="session" :scope-id="session.id" :synthesis="latestSynthesis(dashboard.syntheses, 'session', session.id)" :busy="queued.has('session:' + session.id)" @generate="generate" /></div>
      </section>

      <section>
        <div class="section-heading"><p class="eyebrow">Recursive level 02</p><h2 class="display">Tracks</h2></div>
        <div class="scope-grid"><ScopePanel v-for="track in dashboard.tracks" :key="track.id" label="Track synthesis" :title="track.title" scope-type="track" :scope-id="track.id" :synthesis="latestSynthesis(dashboard.syntheses, 'track', track.id)" :busy="queued.has('track:' + track.id)" @generate="generate" /></div>
      </section>

      <section v-if="conference" id="conference">
        <div class="section-heading"><p class="eyebrow">Recursive level 03</p><h2 class="display">Whole conference</h2></div>
        <ScopePanel label="Conference synthesis" :title="conference.title" scope-type="conference" :scope-id="conference.id" :synthesis="conferenceSynthesis" :busy="queued.has('conference:' + conference.id)" @generate="generate" />
      </section>

      <section v-if="conference" id="world-cafe" class="world-cafe">
        <div class="section-heading"><p class="eyebrow">Collective S5 · Closing inquiry</p><h2 class="display">World Café questions</h2><button type="button" :disabled="queued.has('world-cafe:' + conference.id)" @click="generate('world-cafe', conference.id)">Generate final questions</button></div>
        <QuestionList v-if="questions.length" :questions="questions" /><p v-else class="empty">Generate the conference synthesis first, then create three or four closing questions.</p>
      </section>

      <section>
        <div class="section-heading"><p class="eyebrow">Participant access</p><h2 class="display">Session QR codes</h2></div>
        <SessionQrPrintList :sessions="dashboard.sessions" :tracks="dashboard.tracks" />
      </section>
    </template>
  </main>
</template>
<style scoped>
main { max-width: 90rem; min-height: 100dvh; margin: auto; padding: clamp(1rem, 4vw, 4rem); }
.masthead { display: grid; grid-template-columns: auto 1fr auto; gap: 1rem; align-items: center; padding-bottom: 1.5rem; border-bottom: 1px solid var(--rule); }
.mark { display: grid; width: 3.5rem; height: 3.5rem; place-content: center; border-radius: 50%; color: white; background: var(--ink); font-family: Charter, serif; font-weight: 800; line-height: .85; text-align: center; text-decoration: none; transform: rotate(-5deg); }
h1 { margin: .15rem 0 0; font-size: clamp(2.1rem, 5vw, 4.5rem); line-height: .9; }
button { min-height: 44px; padding: .65rem .9rem; border: 1px solid var(--ink); color: var(--ink); background: transparent; font-weight: 750; cursor: pointer; }
button:disabled { opacity: .5; }
.gate { display: grid; max-width: 32rem; gap: 1.2rem; margin: 14vh auto; padding: 2rem; border: 1px solid var(--rule); background: rgb(255 255 255 / 35%); }
.gate h2 { margin: 0; font-size: 2.5rem; line-height: 1; }
.gate label { display: grid; gap: .5rem; font-weight: 700; }
.gate input { min-height: 48px; padding: .7rem; border: 1px solid var(--rule); background: white; }
.gate button { color: white; background: var(--ink); }
nav { position: sticky; z-index: 2; top: 0; display: flex; gap: 1px; margin: 1.5rem 0 0; overflow-x: auto; background: var(--rule); }
nav a { display: flex; min-width: max-content; min-height: 44px; gap: .6rem; align-items: center; padding: .65rem .85rem; color: var(--ink); background: var(--paper); font-size: .78rem; font-weight: 750; text-decoration: none; }
nav b { color: var(--signal); }
section { scroll-margin-top: 5rem; padding: clamp(3.5rem, 8vw, 7rem) 0 0; }
.section-heading { display: grid; grid-template-columns: 1fr auto; gap: .7rem 1rem; align-items: end; margin-bottom: 1.5rem; }
.section-heading .eyebrow { grid-column: 1 / -1; }
h2 { max-width: 14ch; margin: 0; font-size: clamp(2.4rem, 6vw, 5.5rem); line-height: .87; }
.contributions { display: grid; grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr)); gap: .8rem; }
.scope-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 27rem), 1fr)); gap: .8rem; }
.world-cafe { padding-bottom: 1rem; }
.empty { padding: 2rem; border: 1px dashed var(--rule); color: var(--muted); }
.banner { position: sticky; z-index: 3; top: 3.5rem; padding: .8rem; color: white; background: #9b2412; }
@media (max-width: 34rem) { .masthead { grid-template-columns: auto 1fr; } .masthead > button { grid-column: 1 / -1; } .section-heading { grid-template-columns: 1fr; } }
</style>
