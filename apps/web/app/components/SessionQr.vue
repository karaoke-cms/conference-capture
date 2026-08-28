<script setup lang="ts">
import QRCode from "qrcode";
import { qrUrl } from "../utils/dashboard";
const props = defineProps<{ slug: string; title: string }>();
const src = ref("");
const url = ref("");
onMounted(async () => {
  url.value = qrUrl(window.location.origin, props.slug);
  src.value = await QRCode.toDataURL(url.value, { width: 256, margin: 1, color: { dark: "#172019", light: "#f2eddf" } });
});
</script>
<template>
  <figure><img v-if="src" :src="src" :alt="`QR code for ${title}`" /><figcaption><strong>{{ title }}</strong><a :href="url">{{ url }}</a></figcaption></figure>
</template>
<style scoped>
figure { display: flex; gap: 1rem; align-items: center; margin: 0; padding: .8rem; border: 1px solid var(--rule); }
img { width: 6rem; height: 6rem; }
figcaption { display: grid; gap: .35rem; min-width: 0; }
a { overflow: hidden; color: var(--muted); font-size: .68rem; text-overflow: ellipsis; white-space: nowrap; }
</style>
