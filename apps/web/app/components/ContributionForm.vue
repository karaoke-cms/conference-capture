<script setup lang="ts">
import { contributionTypes, type ContributionSignal, type ContributionType } from "@conference/contracts";
import { createContributionBody, submissionMessage, validateContributionDraft } from "../utils/contribution-form";

const props = defineProps<{ sessionId: string }>();
const config = useRuntimeConfig();
const caption = ref("");
const type = ref<ContributionType>("capture");
const signal = ref<ContributionSignal>("curious");
const photo = ref<File>();
const preview = ref<string>();
const status = ref<"idle" | "sending" | "success" | "error">("idle");
const error = ref("");
const input = ref<HTMLInputElement>();
const typeLabels: Record<ContributionType, string> = { capture: "Capture", insight: "Insight", question: "Question", algedonic: "Urgent signal" };

function choosePhoto(event: Event) {
  const selected = (event.target as HTMLInputElement).files?.[0];
  if (!selected) return;
  if (preview.value) URL.revokeObjectURL(preview.value);
  photo.value = selected;
  preview.value = URL.createObjectURL(selected);
  status.value = "idle";
}

async function submit() {
  error.value = validateContributionDraft({ caption: caption.value, photo: photo.value }) ?? "";
  if (error.value) return;
  status.value = "sending";
  try {
    const response = await fetch(`${config.public.apiBase}/api/contributions`, {
      method: "POST",
      body: createContributionBody({ sessionId: props.sessionId, caption: caption.value, type: type.value, signal: signal.value, photo: photo.value }),
    });
    if (!response.ok) throw new Error();
    caption.value = ""; photo.value = undefined;
    if (preview.value) URL.revokeObjectURL(preview.value);
    preview.value = undefined;
    if (input.value) input.value.value = "";
    status.value = "success";
  } catch {
    status.value = "error";
  }
}
</script>
<template>
  <form @submit.prevent="submit">
    <div class="photo-field" :class="{ filled: preview }">
      <img v-if="preview" :src="preview" alt="Selected contribution preview" />
      <div v-else class="photo-prompt"><span aria-hidden="true">＋</span><strong>Add a photo</strong><small>Flipchart, sketch, slide, people, place</small></div>
      <input ref="input" type="file" accept="image/jpeg,image/png,image/webp,image/heic" capture="environment" aria-label="Choose or take a photo" @change="choosePhoto" />
    </div>

    <label class="caption"><span>What caught your attention? <small>Optional</small></span><textarea v-model="caption" rows="4" maxlength="2000" placeholder="A phrase, question, tension, or something you noticed…" /></label>

    <fieldset class="types">
      <legend>What kind of contribution is this?</legend>
      <label v-for="item in contributionTypes" :key="item" :class="{ selected: type === item }"><input v-model="type" type="radio" name="type" :value="item" /><span>{{ typeLabels[item] }}</span></label>
    </fieldset>

    <SignalPicker v-model="signal" />
    <p v-if="error" class="error" role="alert">{{ error }}</p>
    <button class="submit" type="submit" :disabled="status === 'sending'">{{ status === "sending" ? "Adding…" : "Add to this session" }}</button>
    <p class="status" aria-live="polite">{{ submissionMessage(status) }}</p>
    <p class="privacy">No account. No participant profile. Contributions are tied only to this session and time.</p>
  </form>
</template>
<style scoped>
form { display: grid; gap: 1.6rem; }
.photo-field { position: relative; min-height: 15rem; overflow: hidden; border: 1.5px dashed var(--moss); border-radius: 1.2rem; background: rgb(255 255 255 / 38%); }
.photo-field input { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; }
.photo-field img { width: 100%; height: 21rem; object-fit: cover; }
.photo-prompt { display: grid; min-height: 15rem; place-content: center; gap: .35rem; text-align: center; }
.photo-prompt > span { color: var(--signal); font-family: Charter, serif; font-size: 3.5rem; line-height: 1; }
.photo-prompt strong { font-family: Charter, serif; font-size: 1.45rem; }
.photo-prompt small { color: var(--muted); }
.caption { display: grid; gap: .6rem; font-weight: 750; }
.caption small { color: var(--muted); font-weight: 500; }
textarea { width: 100%; resize: vertical; padding: 1rem; border: 1px solid var(--rule); border-radius: .8rem; color: var(--ink); background: rgb(255 255 255 / 48%); line-height: 1.5; }
fieldset { padding: 0; border: 0; }
legend { margin-bottom: .7rem; font-weight: 750; }
.types { display: grid; grid-template-columns: 1fr 1fr; gap: .55rem; }
.types legend { grid-column: 1 / -1; }
.types label { position: relative; display: grid; min-height: 48px; place-items: center; padding: .65rem; border: 1px solid var(--rule); border-radius: .55rem; cursor: pointer; }
.types label.selected { color: white; border-color: var(--ink); background: var(--ink); }
.types input { position: absolute; opacity: 0; }
.submit { min-height: 56px; border: 0; border-radius: .65rem; color: white; background: var(--signal); box-shadow: 0 8px 0 #a4371a; font-weight: 800; cursor: pointer; transform: translateY(-3px); }
.submit:active { box-shadow: 0 3px 0 #a4371a; transform: translateY(2px); }
.submit:disabled { opacity: .65; cursor: wait; }
.status, .error, .privacy { margin: 0; }
.status { font-weight: 700; text-align: center; }
.error { color: #9b2412; }
.privacy { color: var(--muted); font-size: .78rem; line-height: 1.5; text-align: center; }
</style>
