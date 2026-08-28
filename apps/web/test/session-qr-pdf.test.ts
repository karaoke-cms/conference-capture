import { expect, test } from "bun:test";
import type { Track } from "@conference/contracts";
import { renderQrPdf } from "../app/utils/session-qr-pdf.client";
import type { QrSession } from "../app/utils/session-qr-print";

test("renders every planned page and places a large QR in the lower third", async () => {
  const calls: Array<{ name: string; args: unknown[] }> = [];
  const document = {
    addPage: () => calls.push({ name: "addPage", args: [] }),
    setFillColor: (...args: unknown[]) => calls.push({ name: "setFillColor", args }),
    rect: (...args: unknown[]) => calls.push({ name: "rect", args }),
    setTextColor: (...args: unknown[]) => calls.push({ name: "setTextColor", args }),
    setFont: (...args: unknown[]) => calls.push({ name: "setFont", args }),
    setFontSize: (...args: unknown[]) => calls.push({ name: "setFontSize", args }),
    text: (...args: unknown[]) => calls.push({ name: "text", args }),
    splitTextToSize: (text: string) => [text],
    addImage: (...args: unknown[]) => calls.push({ name: "addImage", args }),
    output: () => new Blob(["pdf"], { type: "application/pdf" }),
  };
  const track: Track = { id: "t1", conferenceId: "c1", title: "Systems Track", order: 1 };
  const session: QrSession = { id: "s1", trackId: "t1", slug: "long", title: "A Long Session", description: "", speaker: "Ada", track, url: "https://example/session/long" };

  const blob = await renderQrPdf([{ type: "track", track }, { type: "session", session }], {
    createDocument: () => document,
    qrDataUrl: async () => "data:image/png;base64,abc",
  });

  expect(blob.type).toBe("application/pdf");
  expect(calls.filter((call) => call.name === "addPage")).toHaveLength(1);
  const image = calls.find((call) => call.name === "addImage");
  expect(Number(image?.args[3])).toBeGreaterThanOrEqual(190);
  expect(image?.args.slice(4, 6)).toEqual([90, 90]);
});

test("renders track dividers on white with black only behind the track title", async () => {
  const calls: Array<{ name: string; args: unknown[] }> = [];
  const document = {
    addPage: () => {}, setFillColor: (...args: unknown[]) => calls.push({ name: "fill", args }),
    rect: (...args: unknown[]) => calls.push({ name: "rect", args }), setTextColor: () => {}, setFont: () => {},
    setFontSize: () => {}, text: () => {}, splitTextToSize: (text: string) => [text], addImage: () => {},
    output: () => new Blob(["pdf"], { type: "application/pdf" }),
  };
  const track: Track = { id: "t1", conferenceId: "c1", title: "Systems Track", order: 1 };

  await renderQrPdf([{ type: "track", track }], { createDocument: () => document });

  expect(calls).toContainEqual({ name: "fill", args: [242, 237, 223] });
  expect(calls).toContainEqual({ name: "rect", args: [0, 0, 210, 297, "F"] });
  expect(calls).toContainEqual({ name: "fill", args: [23, 32, 25] });
  expect(calls).toContainEqual({ name: "rect", args: [20, 88, 170, 88, "F"] });
});
