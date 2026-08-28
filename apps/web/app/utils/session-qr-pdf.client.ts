import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import type { QrPrintPage, QrSession } from "./session-qr-print";

interface PdfDocument {
  addPage(): unknown;
  setFillColor(...args: any[]): unknown;
  rect(...args: any[]): unknown;
  setTextColor(...args: any[]): unknown;
  setFont(...args: any[]): unknown;
  setFontSize(...args: any[]): unknown;
  text(...args: any[]): unknown;
  splitTextToSize(text: string, width: number): string[];
  addImage(...args: any[]): unknown;
  output(type: "blob"): Blob;
}

export async function renderQrPdf(pages: QrPrintPage[], dependencies: {
  createDocument?: () => PdfDocument;
  qrDataUrl?: (url: string) => Promise<string>;
} = {}): Promise<Blob> {
  if (pages.length === 0) throw new Error("Select at least one session");
  const doc = dependencies.createDocument?.() ?? new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const qrDataUrl = dependencies.qrDataUrl ?? ((url) => QRCode.toDataURL(url, { width: 1200, margin: 1, errorCorrectionLevel: "H" }));

  for (const [index, page] of pages.entries()) {
    if (index > 0) doc.addPage();
    if (page.type === "track") renderTrackPage(doc, page.track.title);
    else renderSessionPage(doc, page.session, await qrDataUrl(page.session.url));
  }
  return doc.output("blob");
}

export async function openQrPdf(pages: QrPrintPage[]): Promise<void> {
  const target = window.open("", "_blank");
  if (!target) throw new Error("Allow pop-ups to open the PDF");
  try {
    target.document.title = "Preparing session QR codes…";
    const blob = await renderQrPdf(pages);
    target.location.href = URL.createObjectURL(blob);
  } catch (error) {
    target.close();
    throw error;
  }
}

function renderTrackPage(doc: PdfDocument, title: string): void {
  doc.setFillColor(23, 32, 25);
  doc.rect(0, 0, 210, 297, "F");
  doc.setTextColor(242, 237, 223);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("METAPHORUM 2026  /  TRACK", 24, 35);
  doc.setFont("times", "bold");
  doc.setFontSize(34);
  doc.text(doc.splitTextToSize(title, 162), 24, 105);
}

function renderSessionPage(doc: PdfDocument, value: QrSession, qr: string): void {
  doc.setFillColor(242, 237, 223);
  doc.rect(0, 0, 210, 297, "F");
  doc.setTextColor(23, 32, 25);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(value.track.title.toUpperCase(), 20, 24);
  doc.setFont("times", "bold");
  doc.setFontSize(27);
  doc.text(doc.splitTextToSize(value.title, 170).slice(0, 4), 20, 49);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(15);
  doc.text(doc.splitTextToSize(value.speaker, 170).slice(0, 2), 20, 112);
  doc.setFontSize(8);
  doc.setTextColor(47, 96, 72);
  doc.text(value.startsAt ? new Date(value.startsAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : "Schedule to be confirmed", 20, 137);
  doc.addImage(qr, "PNG", 60, 197, 90, 90, undefined, "FAST");
}
