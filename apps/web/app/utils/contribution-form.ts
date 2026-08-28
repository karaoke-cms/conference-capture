import type { ContributionSignal, ContributionType } from "@conference/contracts";

export interface ContributionDraft {
  sessionId: string;
  caption: string;
  type: ContributionType;
  signal: ContributionSignal;
  photo?: File;
}

export function validateContributionDraft(value: Pick<ContributionDraft, "caption" | "photo">): string | undefined {
  return value.caption.trim() || value.photo ? undefined : "Add a photo or a written observation.";
}

export function createContributionBody(value: ContributionDraft): FormData {
  const body = new FormData();
  body.set("sessionId", value.sessionId);
  body.set("caption", value.caption.trim());
  body.set("type", value.type);
  body.set("signal", value.signal);
  if (value.photo) body.set("photo", value.photo);
  return body;
}

export function submissionMessage(status: "idle" | "sending" | "success" | "error"): string {
  if (status === "sending") return "Adding your observation…";
  if (status === "success") return "Your observation was added to this session.";
  if (status === "error") return "Your observation was not added. Check your connection and try again.";
  return "";
}
