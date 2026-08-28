<script setup lang="ts">
import type { ScopeType, Synthesis } from "@conference/contracts";
defineProps<{ label: string; title: string; scopeType: ScopeType; scopeId: string; synthesis?: Synthesis; busy?: boolean }>();
defineEmits<{ generate: [scopeType: ScopeType, scopeId: string] }>();
</script>
<template>
  <article>
    <header><div><p class="eyebrow">{{ label }}</p><h3 class="display">{{ title }}</h3></div><button type="button" :disabled="busy" @click="$emit('generate', scopeType, scopeId)">{{ busy ? "Queued" : synthesis ? "Refresh" : "Generate" }}</button></header>
    <template v-if="synthesis">
      <p class="summary">{{ synthesis.summary }}</p>
      <div class="columns">
        <section><h4>Themes</h4><ul><li v-for="theme in synthesis.themes" :key="theme">{{ theme }}</li></ul></section>
        <section><h4>Tensions</h4><ul><li v-for="tension in synthesis.tensions" :key="tension">{{ tension }}</li></ul></section>
      </div>
      <section v-if="synthesis.weakSignals.length"><h4>Weak signals</h4><ul class="signals"><li v-for="signal in synthesis.weakSignals" :key="signal">{{ signal }}</li></ul></section>
      <SentimentChart :sentiment="synthesis.sentiment" />
      <p class="provenance">Grounded in {{ synthesis.sourceContributionIds.length }} source contribution{{ synthesis.sourceContributionIds.length === 1 ? "" : "s" }}.</p>
    </template>
    <p v-else class="empty">No synthesis has been generated for this scope.</p>
  </article>
</template>
<style scoped>
article { display: grid; gap: 1.4rem; padding: 1.5rem; border: 1px solid var(--rule); background: rgb(255 255 255 / 34%); }
header { display: flex; gap: 1rem; justify-content: space-between; align-items: start; }
h3 { margin: .25rem 0 0; font-size: 2rem; line-height: 1; }
button { min-height: 42px; padding: .55rem .8rem; border: 1px solid var(--ink); color: var(--ink); background: transparent; font-weight: 750; cursor: pointer; }
button:disabled { opacity: .5; }
.summary { margin: 0; font-family: Charter, serif; font-size: 1.15rem; line-height: 1.55; }
.columns { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
h4 { margin: 0 0 .55rem; font-size: .7rem; letter-spacing: .12em; text-transform: uppercase; }
ul { display: flex; flex-wrap: wrap; gap: .4rem; margin: 0; padding: 0; list-style: none; }
li { padding: .35rem .55rem; border: 1px solid var(--rule); font-size: .78rem; }
.signals li { border-color: color-mix(in srgb, var(--signal) 45%, transparent); color: #8a321c; }
.provenance, .empty { margin: 0; color: var(--muted); font-size: .75rem; }
@media (max-width: 35rem) { .columns { grid-template-columns: 1fr; } }
</style>
