<script setup lang="ts">
import type { Conference, Session, Track } from "@conference/contracts";
import { buildSessionDirectory } from "../../utils/session-directory";

interface PublicProgramme { conferences: Conference[]; tracks: Track[]; sessions: Session[] }

const config = useRuntimeConfig();
const query = ref("");
const { data, error, status, refresh } = await useFetch<PublicProgramme>(`${config.public.apiBase}/api/sessions`);
const groups = computed(() => buildSessionDirectory(data.value?.tracks ?? [], data.value?.sessions ?? [], query.value));
const resultCount = computed(() => groups.value.reduce((total, group) => total + group.sessions.length, 0));

useHead({ title: "Sessions · Metaphorum 2026" });

function schedule(session: Session): string {
  if (!session.startsAt) return "Schedule to be confirmed";
  return new Intl.DateTimeFormat("en-GB", { weekday: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(session.startsAt));
}

function speaker(description: string): string | undefined {
  return description.match(/(?:^|\n)Speaker:\s*(.+)$/m)?.[1];
}

function excerpt(description: string): string {
  const body = description.split(/\n\nSpeaker:/)[0]?.trim() ?? "";
  return body.length > 190 ? `${body.slice(0, 187).trimEnd()}…` : body;
}
</script>

<template>
  <main>
    <header class="masthead">
      <NuxtLink to="/" class="mark" aria-label="Metaphorum home">M<br />26</NuxtLink>
      <div>
        <p class="eyebrow">Participant directory</p>
        <h1 class="display">Find the conversation you’re in.</h1>
        <p class="intro">Choose a session, then contribute a photograph, observation, tension, or emerging signal.</p>
      </div>
    </header>

    <section class="finder" aria-labelledby="session-search-label">
      <label id="session-search-label" for="session-search">Search sessions or speakers</label>
      <div class="search-row">
        <input id="session-search" v-model="query" type="search" placeholder="Try a title, speaker, or idea…" autocomplete="off" />
        <span aria-live="polite">{{ resultCount }} session{{ resultCount === 1 ? "" : "s" }}</span>
      </div>
    </section>

    <p v-if="status === 'pending'" class="state" role="status">Loading the programme…</p>
    <section v-else-if="error" class="state error" role="alert">
      <p>The session list could not be loaded.</p>
      <button type="button" @click="() => refresh()">Try again</button>
    </section>
    <p v-else-if="groups.length === 0" class="state">No sessions match “{{ query }}”. Try another word.</p>

    <section v-for="(group, groupIndex) in groups" v-else :key="group.track.id" class="track">
      <header class="track-heading">
        <span>{{ String(groupIndex + 1).padStart(2, "0") }}</span>
        <div><p class="eyebrow">Track</p><h2 class="display">{{ group.track.title }}</h2></div>
        <b>{{ group.sessions.length }}</b>
      </header>
      <div class="session-grid">
        <article v-for="session in group.sessions" :key="session.id">
          <p class="schedule">{{ schedule(session) }}</p>
          <h3 class="display">{{ session.title }}</h3>
          <p v-if="speaker(session.description)" class="speaker">{{ speaker(session.description) }}</p>
          <p class="description">{{ excerpt(session.description) }}</p>
          <NuxtLink :to="session.contributeUrl">Contribute <span aria-hidden="true">→</span></NuxtLink>
        </article>
      </div>
    </section>
  </main>
</template>

<style scoped>
main { max-width: 92rem; min-height: 100dvh; margin: auto; padding: clamp(1.2rem, 4vw, 4rem); }
.masthead { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: clamp(1rem, 3vw, 3rem); align-items: start; padding: 1rem 0 clamp(3rem, 8vw, 7rem); }
.mark { display: grid; width: 3.75rem; height: 3.75rem; place-content: center; border-radius: 50%; color: white; background: var(--ink); font-family: Charter, serif; font-weight: 800; line-height: .85; text-align: center; text-decoration: none; transform: rotate(-5deg); }
h1 { max-width: 13ch; margin: .45rem 0 1.25rem; font-size: clamp(3rem, 9vw, 7.5rem); line-height: .84; }
.intro { max-width: 43rem; margin: 0; color: var(--muted); font-size: clamp(1rem, 2vw, 1.3rem); line-height: 1.55; }
.finder { position: sticky; z-index: 3; top: 0; margin: 0 0 clamp(3rem, 6vw, 5rem); padding: 1rem 0; border-block: 1px solid var(--rule); background: color-mix(in srgb, var(--paper) 92%, transparent); backdrop-filter: blur(10px); }
.finder label { display: block; margin-bottom: .45rem; color: var(--moss); font-size: .72rem; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
.search-row { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 1rem; align-items: center; }
input { width: 100%; min-height: 3.2rem; padding: .5rem 0; border: 0; border-bottom: 2px solid var(--ink); border-radius: 0; color: var(--ink); background: transparent; font-family: Charter, serif; font-size: clamp(1.25rem, 3vw, 2rem); }
input::placeholder { color: color-mix(in srgb, var(--muted) 65%, transparent); }
.search-row span { color: var(--muted); font-size: .85rem; font-weight: 750; white-space: nowrap; }
.track { margin-bottom: clamp(4rem, 9vw, 8rem); }
.track-heading { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; gap: 1rem; align-items: start; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 2px solid var(--ink); }
.track-heading > span { color: var(--signal); font-family: Charter, serif; font-size: 2rem; }
.track-heading h2 { max-width: 28ch; margin: .25rem 0 0; font-size: clamp(1.8rem, 4vw, 3.8rem); line-height: .95; }
.track-heading > b { display: grid; min-width: 2.2rem; height: 2.2rem; place-content: center; border-radius: 50%; color: white; background: var(--moss); font-size: .8rem; }
.session-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 21rem), 1fr)); gap: 1px; background: var(--rule); border: 1px solid var(--rule); }
article { display: flex; min-height: 25rem; flex-direction: column; padding: clamp(1.25rem, 3vw, 2rem); background: var(--paper); transition: background .2s ease, transform .2s ease; }
article:hover { position: relative; z-index: 1; background: color-mix(in srgb, var(--paper) 82%, white); transform: translateY(-3px); }
.schedule { margin: 0 0 2rem; color: var(--moss); font-size: .72rem; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
h3 { margin: 0 0 .7rem; font-size: clamp(1.75rem, 3vw, 2.65rem); line-height: .98; }
.speaker { margin: 0 0 1rem; color: var(--signal); font-weight: 750; }
.description { display: -webkit-box; margin: 0 0 1.5rem; overflow: hidden; color: var(--muted); line-height: 1.55; -webkit-box-orient: vertical; -webkit-line-clamp: 4; }
article a { display: flex; min-height: 46px; align-items: center; justify-content: space-between; margin-top: auto; padding: .75rem 1rem; color: white; background: var(--ink); font-weight: 800; text-decoration: none; transition: background .15s ease; }
article a:hover { background: var(--signal); }
article a span { font-size: 1.35rem; }
.state { padding: 3rem; border: 1px dashed var(--rule); color: var(--muted); text-align: center; }
.state button { min-height: 44px; padding: .65rem 1rem; border: 1px solid var(--ink); background: transparent; font-weight: 750; }
.error { color: #8a2414; }
@media (max-width: 38rem) { .masthead { grid-template-columns: 1fr; } .mark { width: 3.2rem; height: 3.2rem; } .search-row { grid-template-columns: 1fr; gap: .5rem; } .search-row span { justify-self: end; } article { min-height: 22rem; } }
</style>
