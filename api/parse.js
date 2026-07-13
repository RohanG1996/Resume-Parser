// Vercel Serverless Function — the only server-side code in the project.
// Exists so the Gemini key stays in process.env and never reaches the browser.

const DEFAULT_MODEL = "gemini-2.5-flash";
const MAX_INPUT_CHARS = 24000; // ~6k tokens; more than any real resume needs

const SCHEMA_AND_RULES = `You are a resume parser. Extract the following fields from the resume text below.
Return ONLY a valid JSON object, no markdown fences, no commentary.
If a field is not present, use null (for single values) or [] (for lists).
Do not invent data. Do not include section headings inside field values.

Schema:
{
  "fullName": string | null,
  "email": string | null,
  "phone": string | null,
  "location": { "city": string | null, "state": string | null },
  "linkedinUrl": string | null,
  "headline": string | null,
  "summary": string | null,
  "workStatus": "fresher" | "experienced" | null,
  "keySkills": string[],
  "employment": [
    { "title": string, "company": string, "location": string | null,
      "startDate": string | null, "endDate": string | null, "isCurrent": boolean }
  ],
  "internships": [
    { "title": string, "company": string, "startDate": string | null, "endDate": string | null }
  ],
  "education": [
    { "degree": string, "institution": string, "startYear": string | null,
      "endYear": string | null, "score": string | null }
  ],
  "certifications": [ { "name": string, "issuer": string | null, "year": string | null } ],
  "projects": [ { "name": string, "description": string | null } ],
  "languages": [ { "language": string, "proficiency": string | null } ]
}

Rules:
- Strip section headings from values (e.g. "PROFESSIONAL SUMMARY" must not appear inside summary).
- Parse the location from the header even if it's on the same line as name/contact.
- Distinguish internships from full-time employment; if the person has only internships/education, set workStatus to "fresher".
- Preserve date ranges as written (e.g. "Jan 2022 – Present").`;

// Every top-level key the UI expects, with a safe default.
const DEFAULTS = {
  fullName: null,
  email: null,
  phone: null,
  location: { city: null, state: null },
  linkedinUrl: null,
  headline: null,
  summary: null,
  workStatus: null,
  keySkills: [],
  employment: [],
  internships: [],
  education: [],
  certifications: [],
  projects: [],
  languages: [],
};

function stripFences(text) {
  let out = text.trim();
  const fenced = out.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fenced) out = fenced[1].trim();
  // Fall back to the outermost braces if any preamble slipped through.
  if (!out.startsWith("{")) {
    const first = out.indexOf("{");
    const last = out.lastIndexOf("}");
    if (first !== -1 && last > first) out = out.slice(first, last + 1);
  }
  return out;
}

function normalize(parsed) {
  const out = { ...DEFAULTS, ...parsed };
  for (const key of Object.keys(DEFAULTS)) {
    const def = DEFAULTS[key];
    if (Array.isArray(def) && !Array.isArray(out[key])) out[key] = [];
    if (key === "location" && (typeof out.location !== "object" || out.location === null)) {
      out.location = { city: null, state: null };
    }
  }
  return out;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. POST { resumeText }." });
  }

  const resumeText = typeof req.body?.resumeText === "string" ? req.body.resumeText.trim() : "";
  if (!resumeText || resumeText.length < 40) {
    return res.status(400).json({
      error: "No readable resume text was provided. The file may be empty or a scanned image.",
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "your_key_here") {
    return res.status(502).json({
      error: "The parsing service isn't configured (missing API key). Set GEMINI_API_KEY and try again.",
    });
  }

  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  const prompt = `${SCHEMA_AND_RULES}\n\nResume text:\n"""\n${resumeText.slice(0, MAX_INPUT_CHARS)}\n"""`;

  let geminiRes;
  try {
    geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0,
            responseMimeType: "application/json",
            // Extraction doesn't need reasoning; skipping it roughly halves latency.
            thinkingConfig: { thinkingBudget: 0 },
          },
        }),
      }
    );
  } catch {
    return res.status(502).json({
      error: "Couldn't reach the parsing service. Please try again in a moment.",
    });
  }

  if (geminiRes.status === 429) {
    return res.status(502).json({
      error: "We've hit the free tier's rate limit. Wait a minute and try again.",
    });
  }
  if (!geminiRes.ok) {
    return res.status(502).json({
      error: `The parsing service returned an error (${geminiRes.status}). Please try again.`,
    });
  }

  let raw;
  try {
    const data = await geminiRes.json();
    raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  } catch {
    raw = null;
  }
  if (!raw) {
    return res.status(502).json({
      error: "The parsing service returned an empty response. Please try again.",
    });
  }

  try {
    const parsed = JSON.parse(stripFences(raw));
    return res.status(200).json(normalize(parsed));
  } catch {
    return res.status(502).json({
      error: "We couldn't make sense of this resume. Please try again.",
    });
  }
}
