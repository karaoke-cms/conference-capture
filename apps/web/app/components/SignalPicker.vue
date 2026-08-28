<script setup lang="ts">
import { contributionSignals, type ContributionSignal } from "@conference/contracts";
const model = defineModel<ContributionSignal>({ required: true });
const labels: Record<ContributionSignal, string> = { curious: "Curious", excited: "Energised", challenged: "Challenged", concerned: "Concerned", confused: "Unclear" };
</script>
<template>
  <fieldset>
    <legend>How did this land?</legend>
    <label v-for="signal in contributionSignals" :key="signal" :class="{ selected: model === signal }">
      <input v-model="model" type="radio" name="signal" :value="signal" />
      <span>{{ labels[signal] }}</span>
    </label>
  </fieldset>
</template>
<style scoped>
fieldset { display: flex; flex-wrap: wrap; gap: .55rem; margin: 0; padding: 0; border: 0; }
legend { width: 100%; margin-bottom: .2rem; font-weight: 750; }
label { position: relative; min-height: 44px; padding: .65rem .9rem; border: 1px solid var(--rule); border-radius: 999px; color: var(--muted); background: rgb(255 255 255 / 35%); cursor: pointer; transition: transform .16s, background .16s; }
label:active { transform: scale(.97); }
label.selected { color: white; border-color: var(--moss); background: var(--moss); }
input { position: absolute; opacity: 0; pointer-events: none; }
</style>
