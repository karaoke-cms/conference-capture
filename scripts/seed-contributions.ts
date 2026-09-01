import { contributionSignals, contributionTypes, type ContributionSignal, type ContributionType } from "../packages/contracts/src";
import type { ConferenceRepository } from "../packages/database/src";
import { createSqliteRepository } from "../packages/database/src";

const observations = [
  "The room lit up when the speaker connected this back to Beer's original diagrams.",
  "I'm not sure the metaphor holds once you scale past a single team.",
  "This is the clearest explanation of variety engineering I've heard in years.",
  "Someone in the audience pushed back hard on the governance framing — worth following up.",
  "The case study felt more like marketing than evidence.",
  "Loved the honesty about what didn't work in the pilot.",
  "This reframes algedonic signals as a design tool rather than an alarm.",
  "Still unclear how this applies outside of a manufacturing context.",
  "The Q&A was more useful than the talk itself.",
  "Strong connection to yesterday's session on distributed decision rights.",
  "The speaker admitted the model breaks down under adversarial conditions — refreshing.",
  "I want to see this tested against a real crisis response, not a simulation.",
  "This talk quietly resolved a tension from this morning's keynote.",
  "The visuals made recursion click for me for the first time.",
  "Felt like a solution looking for a problem.",
  "Good reminder that autonomy without accountability is just drift.",
  "The energy in the room shifted noticeably during the closing remarks.",
  "This is going straight into my notes for the World Café session.",
  "Nice callback to Ashby without belaboring it.",
  "The facilitator's framing question was more provocative than the paper.",
  "I disagree with the claim that this scales linearly with team size.",
  "This surfaced a weak signal about trust erosion that nobody else has named yet.",
  "The practical checklist at the end was worth the whole session.",
  "Too abstract — I couldn't find the operational hook.",
  "This is the first talk that made me rethink our own org chart.",
  "The dialogue between the two co-presenters was more interesting than either solo view.",
  "A quiet but important point about consent in participatory design.",
  "The room went silent when the failure story started — that's rare.",
  "This connects directly to the tension we flagged in track one.",
  "I'd love a follow-up paper on the edge cases mentioned but not explored.",
];

const shortNotes = [
  "Great energy in this room.",
  "Needs more evidence.",
  "Strong applause after the closing slide.",
  "Lots of note-taking happening right now.",
  "Unexpected but welcome tangent into ethics.",
  "This should be a workshop, not a talk.",
  "Packed room, standing room only.",
  "Quiet, thoughtful discussion.",
  "Sparked a side conversation two rows over.",
  "Best slide deck of the day so far.",
];

function pick<T>(items: readonly T[], random: () => number): T {
  return items[Math.floor(random() * items.length)] as T;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seedExampleContributions(repository: ConferenceRepository, count = 200, seed = 42): number {
  const { sessions } = repository.listHierarchy();
  if (sessions.length === 0) {
    throw new Error("No sessions found — seed the conference hierarchy first (bun run seed or bun run import:metaphorum).");
  }

  const random = mulberry32(seed);
  let created = 0;
  for (let i = 0; i < count; i += 1) {
    const session = pick(sessions, random);
    const type: ContributionType = pick(contributionTypes, random);
    const signal: ContributionSignal = pick(contributionSignals, random);
    const useShort = random() < 0.35;
    const caption = pick(useShort ? shortNotes : observations, random);
    repository.createContribution({ sessionId: session.id, caption, type, signal });
    created += 1;
  }
  return created;
}

if (import.meta.main) {
  const path = (process.env.DATABASE_URL ?? "sqlite://.data/conference.db").replace(/^sqlite:\/\//, "");
  const repository = createSqliteRepository(path);
  const requested = Number(process.argv[2] ?? 200);
  const created = seedExampleContributions(repository, requested);
  repository.close();
  console.log(`Created ${created} example contributions in ${path}.`);
}
