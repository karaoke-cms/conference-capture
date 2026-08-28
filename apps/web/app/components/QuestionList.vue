<script setup lang="ts">defineProps<{ questions: string[] }>();</script>
<template>
  <ol>
    <li v-for="(question, index) in questions" :key="question"><span>0{{ index + 1 }}</span><p class="display">{{ question }}</p></li>
  </ol>
</template>
<style scoped>
ol { display: grid; gap: 1px; margin: 0; padding: 0; background: var(--rule); list-style: none; }
li { display: grid; grid-template-columns: 3rem 1fr; gap: 1rem; padding: clamp(1.25rem, 4vw, 2.2rem); background: var(--paper); }
span { color: var(--signal); font-size: .7rem; font-weight: 800; }
p { max-width: 28ch; margin: 0; font-size: clamp(1.35rem, 3vw, 2rem); line-height: 1.08; }
</style>
