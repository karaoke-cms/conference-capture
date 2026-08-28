<script setup lang="ts">useHead({ title: "Metaphorum Sensemaking" });</script>
<template>
  <main>
    <p class="eyebrow">Metaphorum 2026 · Living conference memory</p>
    <h1 class="display">Notice what the conference is thinking.</h1>
    <p>Each contribution becomes part of a traceable synthesis—from session, to track, to the closing World Café.</p>
    <nav><NuxtLink to="/session/ai-and-vsm">Open sample session</NuxtLink><NuxtLink to="/organizer">Organizer view</NuxtLink></nav>
  </main>
</template>
<style scoped>
main { display: grid; max-width: 72rem; min-height: 100dvh; align-content: center; gap: 1.4rem; padding: clamp(2rem, 8vw, 8rem); }
h1 { max-width: 11ch; margin: 0; font-size: clamp(3.5rem, 11vw, 8rem); line-height: .82; }
main > p:not(.eyebrow) { max-width: 39rem; color: var(--muted); font-size: 1.15rem; line-height: 1.6; }
nav { display: flex; flex-wrap: wrap; gap: .7rem; }
a { min-height: 46px; padding: .75rem 1rem; border: 1px solid var(--ink); color: inherit; text-decoration: none; }
a:first-child { color: white; background: var(--ink); }
</style>
