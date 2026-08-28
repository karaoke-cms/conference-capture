<script setup lang="ts">
defineProps<{ conference: string; track: string; title: string; description: string; time: string }>();
</script>
<template>
  <header class="session-header">
    <div class="number">M<br />26</div>
    <div>
      <p class="eyebrow">{{ conference }} · {{ track }}</p>
      <h1 class="display">{{ title }}</h1>
      <p class="description">{{ description }}</p>
      <p class="time">{{ time }}</p>
    </div>
  </header>
</template>
<style scoped>
.session-header { display: grid; grid-template-columns: 4rem 1fr; gap: 1.2rem; padding-bottom: 1.6rem; border-bottom: 1px solid var(--rule); }
.number { display: grid; width: 4rem; height: 4rem; place-content: center; border: 1px solid var(--ink); border-radius: 50%; font-family: Charter, serif; font-size: 1.1rem; font-weight: 700; line-height: .9; text-align: center; transform: rotate(-7deg); }
h1 { max-width: 12ch; margin: .55rem 0 .7rem; font-size: clamp(2.4rem, 10vw, 5rem); line-height: .88; }
.description { max-width: 36rem; margin: 0; color: var(--muted); font-size: 1.02rem; line-height: 1.55; }
.time { margin: 1rem 0 0; font-size: .78rem; font-weight: 750; letter-spacing: .08em; text-transform: uppercase; }
@media (max-width: 34rem) { .session-header { grid-template-columns: 1fr; } .number { width: 3.3rem; height: 3.3rem; } }
</style>
