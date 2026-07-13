// Extracts plain text from legacy binary .doc files (Word 97–2003).
// This is the one format with no browser-side reader, so the file itself
// is sent here (base64) instead of extracted text. Nothing is stored.

import WordExtractor from "word-extractor";

const MAX_FILE_BYTES = 2 * 1024 * 1024;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. POST { fileBase64 }." });
  }

  const fileBase64 = typeof req.body?.fileBase64 === "string" ? req.body.fileBase64 : "";
  if (!fileBase64) {
    return res.status(400).json({ error: "No file was provided." });
  }

  let buffer;
  try {
    buffer = Buffer.from(fileBase64, "base64");
  } catch {
    return res.status(400).json({ error: "The file could not be decoded." });
  }
  if (buffer.length > MAX_FILE_BYTES) {
    return res.status(400).json({ error: "This file is over 2MB. Please upload a smaller resume." });
  }

  try {
    const extractor = new WordExtractor();
    const doc = await extractor.extract(buffer);
    const text = (doc.getBody() || "").trim();
    return res.status(200).json({ text });
  } catch (err) {
    console.error("extract-doc failed:", err);
    return res.status(422).json({
      error:
        "We couldn't read this .doc file. If it opens fine in Word, save it as PDF or DOCX and upload that instead.",
    });
  }
}
