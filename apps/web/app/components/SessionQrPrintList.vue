<script setup lang="ts">
import type { Session, Track } from "@conference/contracts";
import { buildQrPrintPages, sortQrSessions, type QrSort } from "../utils/session-qr-print";
import { openQrPdf } from "../utils/session-qr-pdf.client";

const props = defineProps<{ sessions: Session[]; tracks: Track[] }>();
const sort = ref<QrSort>("alphabetical");
const selected = ref(new Set(props.sessions.map((session) => session.id)));
const printing = ref(false);
const error = ref("");
const rows = computed(() => sortQrSessions(props.sessions, props.tracks, sort.value, windowOrigin()));
const selectedRows = computed(() => rows.value.filter((session) => selected.value.has(session.id)));
const allSelected = computed(() => props.sessions.length > 0 && selected.value.size === props.sessions.length);
const isPartial = computed(() => selected.value.size > 0 && !allSelected.value);

function windowOrigin(): string { return import.meta.client ? window.location.origin : "http://localhost:3000"; }
function setAll(value: boolean): void { selected.value = new Set(value ? props.sessions.map((session) => session.id) : []); }
function toggle(id: string, value: boolean): void {
  const next = new Set(selected.value);
  value ? next.add(id) : next.delete(id);
  selected.value = next;
}
function schedule(session: Session): string {
  return session.startsAt ? new Intl.DateTimeFormat("en-GB", { weekday: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(session.startsAt)) : "Unscheduled";
}
async function printSelected(): Promise<void> {
  printing.value = true; error.value = "";
  try { await openQrPdf(buildQrPrintPages(selectedRows.value, sort.value)); }
  catch (cause) { error.value = cause instanceof Error ? cause.message : "The PDF could not be created."; }
  finally { printing.value = false; }
}
</script>

<template>
  <div class="qr-print">
    <div class="toolbar">
      <label class="all"><input type="checkbox" :checked="allSelected" :indeterminate="isPartial" @change="setAll(($event.target as HTMLInputElement).checked)" />All</label>
      <label class="sort"><span>Sort by</span><select v-model="sort"><option value="alphabetical">Alphabetical</option><option value="time">Time</option><option value="track">Track</option></select></label>
      <button type="button" :disabled="printing || selected.size === 0" @click="printSelected">{{ printing ? "Creating PDF…" : `Print selected (${selected.size})` }}</button>
    </div>
    <p v-if="error" class="error" role="alert">{{ error }}</p>
    <ul>
      <li v-for="session in rows" :key="session.id">
        <label>
          <input type="checkbox" :checked="selected.has(session.id)" @change="toggle(session.id, ($event.target as HTMLInputElement).checked)" />
          <span class="session"><strong>{{ session.title }}</strong><small>{{ session.speaker }} · {{ session.track.title }}</small></span>
          <span class="time">{{ schedule(session) }}</span>
        </label>
      </li>
    </ul>
    <div class="footer-controls">
      <label class="all"><input type="checkbox" :checked="allSelected" :indeterminate="isPartial" @change="setAll(($event.target as HTMLInputElement).checked)" />All</label>
      <button type="button" :disabled="printing || selected.size === 0" @click="printSelected">{{ printing ? "Creating PDF…" : `Print selected (${selected.size})` }}</button>
    </div>
  </div>
</template>

<style scoped>
.qr-print { border-top: 2px solid var(--ink); }
.toolbar, .footer-controls { display: grid; grid-template-columns: auto minmax(12rem, 1fr) auto; gap: 1rem; align-items: center; padding: 1rem 0; border-bottom: 1px solid var(--rule); }
.footer-controls { grid-template-columns: 1fr auto; border-top: 1px solid var(--rule); border-bottom: 0; }
.all { display: flex; min-height: 44px; gap: .55rem; align-items: center; font-weight: 800; }
input[type="checkbox"] { width: 1.25rem; height: 1.25rem; accent-color: var(--signal); }
.sort { display: flex; gap: .6rem; align-items: center; justify-self: end; color: var(--muted); font-size: .8rem; font-weight: 750; }
select { min-height: 44px; padding: .55rem 2rem .55rem .7rem; border: 1px solid var(--ink); color: var(--ink); background: var(--paper); font: inherit; }
button { min-height: 44px; padding: .7rem 1rem; border: 1px solid var(--ink); color: white; background: var(--ink); font-weight: 800; cursor: pointer; }
button:hover:not(:disabled) { background: var(--signal); border-color: var(--signal); }
button:disabled { opacity: .45; cursor: not-allowed; }
ul { margin: 0; padding: 0; list-style: none; }
li { border-bottom: 1px solid var(--rule); }
li > label { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; gap: 1rem; align-items: center; min-height: 4.7rem; padding: .8rem .25rem; cursor: pointer; }
li:hover { background: rgb(255 255 255 / 35%); }
.session { display: grid; gap: .28rem; }
.session strong { font-family: Charter, serif; font-size: 1.2rem; line-height: 1.05; }
.session small { overflow: hidden; color: var(--muted); text-overflow: ellipsis; white-space: nowrap; }
.time { color: var(--moss); font-size: .7rem; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; white-space: nowrap; }
.error { padding: .8rem; color: white; background: #9b2412; }
@media (max-width: 46rem) { .toolbar { grid-template-columns: 1fr auto; } .sort { grid-column: 1 / -1; grid-row: 2; justify-self: stretch; justify-content: space-between; } li > label { grid-template-columns: auto minmax(0, 1fr); } .time { grid-column: 2; } .session small { white-space: normal; } }
</style>
