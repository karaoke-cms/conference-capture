import { Database } from "bun:sqlite";
import type { Conference, Contribution, ContributionInput, ProcessingJob, ScopeType, Session, Synthesis, Track } from "@conference/contracts";
import type { ConferenceRepository, SessionContext, SynthesisInput } from "./repository";
import migration from "../migrations/0000_initial.sql" with { type: "text" };

const id = (prefix: string) => `${prefix}_${crypto.randomUUID()}`;
const now = () => new Date().toISOString();
const parse = <T>(value: string | null, fallback: T): T => value ? JSON.parse(value) as T : fallback;

export function createSqliteRepository(path: string): ConferenceRepository {
  const db = new Database(path, { create: true });
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec(migration);

  const repository: ConferenceRepository = {
    createConference(value) {
      db.query("INSERT INTO conferences VALUES (?, ?, ?, ?, ?, ?)").run(value.id, value.slug, value.title, value.description, value.startsAt, value.endsAt);
      return value;
    },
    createTrack(value) {
      db.query("INSERT INTO tracks VALUES (?, ?, ?, ?)").run(value.id, value.conferenceId, value.title, value.order);
      return value;
    },
    createSession(value) {
      db.query("INSERT INTO sessions VALUES (?, ?, ?, ?, ?, ?, ?)").run(value.id, value.trackId, value.slug, value.title, value.description, value.startsAt, value.endsAt);
      return value;
    },
    getSessionContext(slug): SessionContext | undefined {
      const row = db.query(`SELECT c.id c_id, c.slug c_slug, c.title c_title, c.description c_description, c.starts_at c_starts, c.ends_at c_ends,
        t.id t_id, t.conference_id t_conference, t.title t_title, t.sort_order t_order,
        s.id s_id, s.track_id s_track, s.slug s_slug, s.title s_title, s.description s_description, s.starts_at s_starts, s.ends_at s_ends
        FROM sessions s JOIN tracks t ON t.id=s.track_id JOIN conferences c ON c.id=t.conference_id WHERE s.slug=?`).get(slug) as Record<string, string | number> | null;
      if (!row) return undefined;
      return {
        conference: { id: String(row.c_id), slug: String(row.c_slug), title: String(row.c_title), description: String(row.c_description), startsAt: String(row.c_starts), endsAt: String(row.c_ends) },
        track: { id: String(row.t_id), conferenceId: String(row.t_conference), title: String(row.t_title), order: Number(row.t_order) },
        session: { id: String(row.s_id), trackId: String(row.s_track), slug: String(row.s_slug), title: String(row.s_title), description: String(row.s_description), startsAt: String(row.s_starts), endsAt: String(row.s_ends) },
      };
    },
    listHierarchy() {
      const conferences = db.query("SELECT id, slug, title, description, starts_at startsAt, ends_at endsAt FROM conferences ORDER BY starts_at").all() as Conference[];
      const tracks = db.query("SELECT id, conference_id conferenceId, title, sort_order 'order' FROM tracks ORDER BY sort_order").all() as Track[];
      const sessions = db.query("SELECT id, track_id trackId, slug, title, description, starts_at startsAt, ends_at endsAt FROM sessions ORDER BY starts_at").all() as Session[];
      return { conferences, tracks, sessions };
    },
    createContribution(value) {
      const contribution: Contribution = { id: id("con"), sessionId: value.sessionId, createdAt: now(), caption: value.caption, type: value.type, signal: value.signal, mediaUrl: value.mediaUrl, mediaKey: value.mediaKey, tags: [], processingStatus: "pending" };
      db.query("INSERT INTO contributions (id, session_id, created_at, caption, contribution_type, signal, media_url, media_key) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(contribution.id, contribution.sessionId, contribution.createdAt, contribution.caption ?? null, contribution.type, contribution.signal, contribution.mediaUrl ?? null, contribution.mediaKey ?? null);
      return contribution;
    },
    listContributions(filter = {}) {
      const rows = (filter.sessionId
        ? db.query("SELECT * FROM contributions WHERE session_id=? ORDER BY created_at DESC").all(filter.sessionId)
        : db.query("SELECT * FROM contributions ORDER BY created_at DESC").all()) as Record<string, string | null>[];
      return rows.map(rowToContribution);
    },
    updateContributionAnalysis(contributionId, analysis) {
      db.query("UPDATE contributions SET ai_description=?, tags_json=?, inferred_sentiment=?, embedding_json=?, processing_status='processed' WHERE id=?").run(analysis.aiDescription, JSON.stringify(analysis.tags), analysis.inferredSentiment, JSON.stringify(analysis.embedding), contributionId);
    },
    enqueueJob(value) {
      const job: ProcessingJob = { id: id("job"), type: value.type, scopeId: value.scopeId, status: "pending", scheduledAt: value.scheduledAt ?? now(), attempts: 0 };
      db.query("INSERT INTO processing_jobs (id, job_type, scope_id, status, scheduled_at, attempts) VALUES (?, ?, ?, ?, ?, ?)").run(job.id, job.type, job.scopeId, job.status, job.scheduledAt, job.attempts);
      return job;
    },
    claimNextJob() {
      const row = db.query("SELECT * FROM processing_jobs WHERE status='pending' AND scheduled_at <= ? ORDER BY scheduled_at LIMIT 1").get(now()) as Record<string, string | number | null> | null;
      if (!row) return undefined;
      db.query("UPDATE processing_jobs SET status='processing', attempts=attempts+1 WHERE id=? AND status='pending'").run(row.id);
      return { id: String(row.id), type: String(row.job_type) as ProcessingJob["type"], scopeId: String(row.scope_id), status: "processing", scheduledAt: String(row.scheduled_at), attempts: Number(row.attempts) + 1 };
    },
    completeJob(jobId) { db.query("UPDATE processing_jobs SET status='completed', error=NULL WHERE id=?").run(jobId); },
    failJob(jobId, error) { db.query("UPDATE processing_jobs SET status='failed', error=? WHERE id=?").run(error, jobId); },
    listJobs() {
      return (db.query("SELECT * FROM processing_jobs ORDER BY scheduled_at DESC").all() as Record<string, string | number | null>[]).map((row) => ({
        id: String(row.id), type: String(row.job_type) as ProcessingJob["type"], scopeId: String(row.scope_id), status: String(row.status) as ProcessingJob["status"], scheduledAt: String(row.scheduled_at), attempts: Number(row.attempts), error: row.error ? String(row.error) : undefined,
      }));
    },
    saveSynthesis(value) {
      const synthesis: Synthesis = { ...value, id: id("syn"), generatedAt: now(), sourceContributionIds: [...new Set(value.sourceContributionIds)].sort() };
      db.transaction(() => {
        db.query("INSERT INTO syntheses VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(synthesis.id, synthesis.scopeType, synthesis.scopeId, synthesis.generatedAt, synthesis.summary, JSON.stringify(synthesis.themes), JSON.stringify(synthesis.tensions), JSON.stringify(synthesis.weakSignals), JSON.stringify(synthesis.sentiment), JSON.stringify(synthesis.questions));
        const insert = db.query("INSERT INTO synthesis_sources VALUES (?, ?)");
        for (const sourceId of synthesis.sourceContributionIds) insert.run(synthesis.id, sourceId);
      })();
      return synthesis;
    },
    latestSynthesis(scopeType, scopeId) {
      const row = db.query("SELECT * FROM syntheses WHERE scope_type=? AND scope_id=? ORDER BY generated_at DESC LIMIT 1").get(scopeType, scopeId) as Record<string, string> | null;
      return row ? rowToSynthesis(db, row) : undefined;
    },
    listSyntheses() {
      return (db.query("SELECT * FROM syntheses ORDER BY generated_at DESC").all() as Record<string, string>[]).map((row) => rowToSynthesis(db, row));
    },
    close() { db.close(); },
  };
  return repository;
}

function rowToContribution(row: Record<string, string | null>): Contribution {
  return {
    id: String(row.id), sessionId: String(row.session_id), createdAt: String(row.created_at), caption: row.caption ?? undefined,
    type: row.contribution_type as Contribution["type"], signal: row.signal as Contribution["signal"], mediaUrl: row.media_url ?? undefined,
    mediaKey: row.media_key ?? undefined, aiDescription: row.ai_description ?? undefined, tags: parse(row.tags_json, []),
    inferredSentiment: row.inferred_sentiment ?? undefined, embedding: parse(row.embedding_json, undefined), processingStatus: row.processing_status as Contribution["processingStatus"],
  };
}

function rowToSynthesis(db: Database, row: Record<string, string>): Synthesis {
  const sources = db.query("SELECT contribution_id FROM synthesis_sources WHERE synthesis_id=? ORDER BY contribution_id").all(row.id) as { contribution_id: string }[];
  return {
    id: row.id, scopeType: row.scope_type as ScopeType, scopeId: row.scope_id, generatedAt: row.generated_at, summary: row.summary,
    themes: parse(row.themes_json, []), tensions: parse(row.tensions_json, []), weakSignals: parse(row.weak_signals_json, []),
    sentiment: parse(row.sentiment_json, {}), questions: parse(row.questions_json, []), sourceContributionIds: sources.map((item) => item.contribution_id),
  };
}
