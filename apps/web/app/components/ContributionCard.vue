<script setup lang="ts">
import type { Contribution } from "@conference/contracts";
defineProps<{ contribution: Contribution }>();
</script>
<template>
  <article>
    <img v-if="contribution.mediaUrl" :src="contribution.mediaUrl" alt="" loading="lazy" />
    <div>
      <p class="meta">{{ contribution.type }} · {{ contribution.signal }} · {{ new Date(contribution.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }}</p>
      <p v-if="contribution.caption" class="caption">{{ contribution.caption }}</p>
      <p v-else-if="contribution.aiDescription" class="caption">{{ contribution.aiDescription }}</p>
      <div class="tags"><span v-for="tag in contribution.tags" :key="tag">{{ tag }}</span></div>
      <small :class="contribution.processingStatus">{{ contribution.processingStatus }}</small>
    </div>
  </article>
</template>
<style scoped>
article { overflow: hidden; border: 1px solid var(--rule); background: rgb(255 255 255 / 35%); }
img { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; }
article > div { display: grid; gap: .7rem; padding: 1rem; }
.meta { margin: 0; color: var(--moss); font-size: .65rem; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
.caption { margin: 0; font-family: Charter, serif; font-size: 1.05rem; line-height: 1.4; }
.tags { display: flex; flex-wrap: wrap; gap: .3rem; }
.tags span { color: var(--muted); font-size: .7rem; }
small { justify-self: start; padding: .2rem .4rem; background: var(--paper-deep); font-size: .62rem; text-transform: uppercase; }
small.processed { color: white; background: var(--moss); }
small.failed { color: white; background: var(--signal); }
</style>
