import type { Conference, Contribution, ProcessingJob, ScopeType, Session, Synthesis, Track } from "@conference/contracts";
import { latestSynthesis } from "../utils/dashboard";

interface Dashboard { conferences: Conference[]; tracks: Track[]; sessions: Session[]; contributions: Contribution[]; syntheses: Synthesis[]; jobs: ProcessingJob[] }

export function useOrganizerDashboard() {
  const config = useRuntimeConfig();
  const token = useState<string>("organizer-token", () => "");
  const dashboard = useState<Dashboard | undefined>("organizer-dashboard", () => undefined);
  const error = useState<string>("organizer-error", () => "");
  const loading = useState<boolean>("organizer-loading", () => false);
  const queued = useState<Set<string>>("organizer-queued", () => new Set());

  function restoreToken() {
    // localStorage so a link opened in a new tab stays signed in; sessionStorage is per-tab.
    if (import.meta.client && !token.value) token.value = localStorage.getItem("organizer-token") ?? sessionStorage.getItem("organizer-token") ?? "";
  }

  async function load() {
    loading.value = true; error.value = "";
    try {
      const response = await fetch(`${config.public.apiBase}/api/organizer/dashboard`, { headers: { authorization: `Bearer ${token.value}` } });
      if (!response.ok) throw new Error(response.status === 401 ? "That organizer token was not accepted." : "The dashboard could not be loaded.");
      dashboard.value = await response.json();
      if (import.meta.client) localStorage.setItem("organizer-token", token.value);
      queued.value = new Set();
    } catch (cause) { error.value = cause instanceof Error ? cause.message : "The dashboard could not be loaded."; }
    finally { loading.value = false; }
  }

  async function generate(scopeType: ScopeType | "world-cafe", scopeId: string) {
    const key = `${scopeType}:${scopeId}`; queued.value = new Set([...queued.value, key]);
    const previous = dashboard.value ? latestSynthesis(dashboard.value.syntheses, scopeType === "world-cafe" ? "conference" : scopeType, scopeId)?.generatedAt : undefined;
    const response = await fetch(`${config.public.apiBase}/api/organizer/synthesis`, {
      method: "POST", headers: { authorization: `Bearer ${token.value}`, "content-type": "application/json" },
      body: JSON.stringify({ scopeType, scopeId }),
    });
    if (!response.ok) {
      error.value = "The synthesis job could not be queued.";
      queued.value = new Set([...queued.value].filter((item) => item !== key));
      return;
    }
    for (let attempt = 0; attempt < 30; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await load();
      const current = dashboard.value ? latestSynthesis(dashboard.value.syntheses, scopeType === "world-cafe" ? "conference" : scopeType, scopeId)?.generatedAt : undefined;
      if (current && current !== previous) return;
      queued.value = new Set([...queued.value, key]);
    }
    queued.value = new Set([...queued.value].filter((item) => item !== key));
  }

  async function importSessions() {
    const response = await fetch(`${config.public.apiBase}/api/organizer/import-sessions`, {
      method: "POST", headers: { authorization: `Bearer ${token.value}` },
    });
    if (!response.ok) throw new Error("The sessions could not be imported.");
    const result = await response.json() as { tracks: number; sessions: number; scheduled: number; removedDemoSessions: number };
    await load();
    return result;
  }

  const conference = computed(() => dashboard.value?.conferences[0]);
  const conferenceSynthesis = computed(() => conference.value && dashboard.value ? latestSynthesis(dashboard.value.syntheses, "conference", conference.value.id) : undefined);
  const questions = computed(() => conferenceSynthesis.value?.questions ?? []);

  function sessionTitle(sessionId: string): string {
    return dashboard.value?.sessions.find((session) => session.id === sessionId)?.title ?? "Unknown session";
  }

  return { token, dashboard, error, loading, queued, restoreToken, load, generate, importSessions, conference, conferenceSynthesis, questions, sessionTitle };
}
