// Client-side file -> plain-text extraction. The file never leaves the browser;
// only the extracted text is sent to /api/parse.

import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import mammoth from "mammoth/mammoth.browser";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export const MAX_FILE_BYTES = 2 * 1024 * 1024; // mirror Naukri's ~2MB limit

export class ExtractionError extends Error {}

const SCANNED_MSG =
  "We couldn't find any text in this file. If it's a scanned image, try a text-based PDF or DOCX instead.";

async function extractPdf(file) {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const pages = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    // Rebuild line breaks from the text items so headings/bullets keep structure.
    let line = "";
    let lastY = null;
    const lines = [];
    for (const item of content.items) {
      const y = item.transform?.[5];
      if (lastY !== null && y !== undefined && Math.abs(y - lastY) > 2) {
        lines.push(line.trimEnd());
        line = "";
      }
      line += item.str + (item.hasEOL ? "" : " ");
      if (y !== undefined) lastY = y;
    }
    if (line.trim()) lines.push(line.trimEnd());
    pages.push(lines.join("\n"));
  }
  return pages.join("\n\n");
}

async function extractDocx(file) {
  const buffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer: buffer });
  return result.value || "";
}

// Legacy .doc has no browser-side reader, so this one format is extracted
// server-side: the file goes up as base64, plain text comes back.
async function extractDoc(file) {
  const buffer = await file.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  const res = await fetch("/api/extract-doc", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileBase64: btoa(binary) }),
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* handled below */
  }
  if (!res.ok) {
    throw new ExtractionError(
      data?.error || "We couldn't read this .doc file. Try saving it as PDF or DOCX."
    );
  }
  return data?.text || "";
}

// Cheap RTF -> text: strip control words, groups, and decode escapes.
function extractRtf(rtf) {
  return rtf
    .replace(/\\par[d]?\b/g, "\n")
    .replace(/\\line\b/g, "\n")
    .replace(/\\tab\b/g, "\t")
    .replace(/\\'([0-9a-fA-F]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/\\u(-?\d+)\??/g, (_, code) => String.fromCharCode((parseInt(code, 10) + 65536) % 65536))
    .replace(/\{\\\*[^{}]*\}/g, "")
    .replace(/\\[a-zA-Z]+-?\d*\s?/g, "")
    .replace(/[{}]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function extractText(file) {
  if (file.size > MAX_FILE_BYTES) {
    throw new ExtractionError("This file is over 2MB. Please upload a smaller resume.");
  }

  const name = file.name.toLowerCase();
  let text = "";

  try {
    if (name.endsWith(".pdf")) {
      text = await extractPdf(file);
    } else if (name.endsWith(".docx")) {
      text = await extractDocx(file);
    } else if (name.endsWith(".rtf")) {
      text = extractRtf(await file.text());
    } else if (name.endsWith(".doc")) {
      text = await extractDoc(file);
    } else {
      throw new ExtractionError("Please upload a PDF, DOCX or RTF resume.");
    }
  } catch (err) {
    if (err instanceof ExtractionError) throw err;
    throw new ExtractionError(
      "We couldn't open this file. Try saving it again as PDF or DOCX."
    );
  }

  const normalized = text
    .replace(/ /g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (normalized.replace(/\s/g, "").length < 40) {
    throw new ExtractionError(SCANNED_MSG);
  }
  return normalized;
}
