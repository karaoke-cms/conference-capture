<script setup lang="ts">
import { sentimentPercentages } from "../utils/dashboard";
const props = defineProps<{ sentiment: Record<string, number> }>();
const rows = computed(() => sentimentPercentages(props.sentiment));
</script>
<template>
  <div v-if="rows.length" class="chart" aria-label="Participant sentiment distribution">
    <div v-for="row in rows" :key="row.label" class="row">
      <span>{{ row.label }}</span><div class="track"><i :style="{ width: row.percentage + '%' }" /></div><strong>{{ row.percentage }}%</strong>
    </div>
  </div>
  <p v-else class="empty">No sentiment signals yet.</p>
</template>
<style scoped>
.chart { display: grid; gap: .55rem; }
.row { display: grid; grid-template-columns: 6.5rem 1fr 3rem; gap: .7rem; align-items: center; font-size: .78rem; text-transform: capitalize; }
.track { height: .5rem; overflow: hidden; border-radius: 1rem; background: var(--paper-deep); }
i { display: block; height: 100%; border-radius: inherit; background: var(--signal); }
strong { text-align: right; }
.empty { color: var(--muted); font-size: .85rem; }
</style>
