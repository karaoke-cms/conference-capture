import { describe, expect, test } from "bun:test";
import { createContributionBody, validateContributionDraft } from "../app/utils/contribution-form";

describe("contribution form state", () => {
  test("requires either a photo or meaningful text", () => {
    expect(validateContributionDraft({ caption: "  ", photo: undefined })).toBe("Add a photo or a written observation.");
    expect(validateContributionDraft({ caption: "An insight", photo: undefined })).toBeUndefined();
  });

  test("serializes session, signal, type, caption, and photo", () => {
    const photo = new File([new Uint8Array([1])], "note.jpg", { type: "image/jpeg" });
    const body = createContributionBody({ sessionId: "s1", caption: " A thought ", type: "insight", signal: "curious", photo });
    expect(body.get("sessionId")).toBe("s1");
    expect(body.get("caption")).toBe("A thought");
    const serialized = body.get("photo");
    expect(serialized).toBeInstanceOf(File);
    expect((serialized as File).name).toBe("note.jpg");
    expect((serialized as File).type).toBe("image/jpeg");
  });
});
