# Resume-First Registration + Parser — Build Plan

> Handoff spec for Claude Code. Build a standalone web app that demonstrates a resume-first registration flow: the user uploads a resume as the very first step, it is genuinely parsed, and the rest of the profile arrives pre-filled for review and confirmation. This is the working prototype for a product design case study on Naukri's fresher onboarding.

---

## 0. The one-line intent

Real Naukri asks for name/email/password/mobile/work-status first, and treats the resume as optional (experienced) or never asks for it (fresher). **This prototype inverts that:** the resume is the first thing asked, for *everyone*, and the profile is built from it. The app must actually parse real uploaded resumes — not fake it — because the case study uses it as feasibility evidence.

---

## 1. Stack & hosting

- **Frontend:** Vite + React (JavaScript, not TypeScript, unless you prefer TS — either is fine).
- **Styling:** plain CSS or Tailwind — builder's choice. Visual direction: clean, Naukri-adjacent (blue accent `#0A66C2`-ish is fine, but this is a redesign so it doesn't need to match Naukri pixel-for-pixel).
- **Backend:** Vercel Serverless Function (a single file under `/api/`). This exists **only** to hold the Gemini API key server-side and proxy the parse call. The key must never appear in frontend code or the browser bundle.
- **Parsing brain:** Google Gemini API, free tier (`gemini-1.5-flash` or the current free-tier flash model). Free within daily limits, which prototype usage will not exceed.
- **Hosting:** GitHub repo → deployed on Vercel. The Vercel serverless function and the React frontend deploy together from the same repo.
- **Cost target:** $0. Vite, React, the extraction libraries, Vercel's free tier (static hosting + serverless functions), and Gemini's free tier all cost nothing at this scale.

---

## 2. File → text extraction (runs in the browser, before the API call)

The app must accept **PDF** and **DOCX** (Naukri also allows DOC and RTF — support those if cheap, but PDF + DOCX are the priority).

- **PDF:** use `pdfjs-dist` (Mozilla's pdf.js) to extract text content client-side. No server needed for this step.
- **DOCX:** use `mammoth` (browser build) to extract raw text from .docx.
- Extract to a single plain-text string. Keep line breaks where possible — they help the parser understand structure (headings, bullet boundaries).
- If extraction yields near-empty text (e.g. a scanned image-only PDF), surface a clear message: "We couldn't read text from this file — it may be a scanned image. Try a text-based PDF or DOCX." (Do **not** attempt OCR in this build — out of scope.)

---

## 3. Text → structured fields (the `/api/parse` serverless function)

This is the core. The browser sends the extracted resume **text** (not the file) to `/api/parse`; the function calls Gemini and returns structured JSON.

### 3a. The serverless function (`/api/parse.js`)
- Reads `GEMINI_API_KEY` from `process.env` (set in Vercel dashboard as an environment variable — never committed).
- Accepts a POST with `{ resumeText: string }`.
- Calls the Gemini API with the prompt below.
- Returns the parsed JSON to the frontend.
- Handles errors: bad/empty input → 400; Gemini failure or rate-limit → 502 with a readable message the frontend can show.

### 3b. The extraction prompt (send to Gemini)
Instruct the model to return **only** valid JSON, no markdown, no preamble. Prompt skeleton:

```
You are a resume parser. Extract the following fields from the resume text below.
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
  "headline": string | null,              // e.g. current/target role title
  "summary": string | null,               // professional summary / objective, heading stripped
  "workStatus": "fresher" | "experienced" | null,  // infer: no full-time roles => fresher
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
- Preserve date ranges as written (e.g. "Jan 2022 – Present").

Resume text:
"""
{RESUME_TEXT_HERE}
"""
```

### 3c. Robust JSON handling
- The model may occasionally wrap output in ```json fences despite instructions — strip them before `JSON.parse`.
- Wrap `JSON.parse` in try/catch; on failure, return a clean error the frontend can display ("We couldn't structure this resume — try again").
- Validate the parsed object has the expected top-level keys; fill missing ones with null/[] defaults so the UI never crashes on an absent field.

> Note: these are exactly the gaps observed in the real Naukri parser during the teardown — headings bleeding into fields, location on line one missed, internships miscategorised. The prompt rules above are written to *fix* those, which makes the prototype a pointed contrast to the real product.

---

## 4. The three screens (frontend flow)

### Screen 1 — Resume-first registration
- **This is the thesis.** The resume upload is the **first and most prominent** element on the form — before name, email, anything.
- Copy something like: "Upload your resume — we'll build your profile in seconds." Big dropzone, drag-and-drop + click-to-browse.
- Accepts PDF/DOCX/DOC/RTF, max ~2MB (mirror Naukri's limit).
- **No fresher/experienced fork at the top.** The resume determines work status — the app infers it from the parse (`workStatus` field) rather than asking upfront. (This is a deliberate design difference from real Naukri and worth calling out in the case study.)
- Optional: below the dropzone, a muted "or fill manually" link that just goes to an empty Screen 3 — shows the redesign still supports the manual path, resume is primary not mandatory.
- On file drop → extract text (Section 2) → show Screen 2.

### Screen 2 — Parsing / loading state
- A genuine loading state while text extraction + the `/api/parse` round-trip happen.
- Show progress feel: "Reading your resume… / Extracting your experience… / Building your profile…" (cycle short messages).
- If parsing fails, show the error and a "try again / upload a different file" action — do **not** dead-end. (The real Naukri flow dead-ends with a wrong "check your internet" error; this prototype should handle failure gracefully — another deliberate contrast.)

### Screen 3 — Pre-filled review & confirm
- The profile, **born pre-filled** from the parse. Every field populated from the resume is shown, editable, in Naukri-like sections: basic details, headline, summary, key skills (as chips), employment, education, certifications, languages, projects.
- Each field the parser filled should feel confirmed-but-editable. Fields the resume didn't contain (DOB, expected salary, preferred location, etc.) appear as clearly-empty "add" fields — the honest residue that genuinely wasn't in the document.
- A visible **profile completeness indicator** that starts high (because the resume filled most of it) — the emotional payoff, and the direct inverse of Naukri's "0% / Add 15 missing details" wall.
- A "Confirm & create profile" button. On click: just show a success state / summary (no real persistence needed — see Section 5).

---

## 5. What's real vs. mocked (be explicit in the README)

- **Real:** file upload, PDF/DOCX text extraction, Gemini-powered parsing of *any* uploaded resume, the editable pre-filled review.
- **Mocked / out of scope:** no database, no auth, no OTP, no real account creation. "Confirm" does not persist anywhere — it's a prototype endpoint. Registration fields like password/mobile can be present for realism but aren't validated or stored.
- **Explicitly out of scope:** OCR for scanned PDFs, mobile-app view, multi-language resume parsing beyond what Gemini handles natively.

State all of this in the README so a case-study reviewer (or interviewer) knows exactly where the real engineering is.

---

## 6. Repo, secrets, deployment

- **Secrets:** `GEMINI_API_KEY` set only in Vercel's environment variables (and a local `.env` that is **gitignored**). Never committed. The frontend never sees it.
- **`.gitignore`:** node_modules, .env, dist, .vercel.
- **README must include:** what the project is (link back to the case study), the stack, how to run locally (`.env` setup with a placeholder key, `npm install`, `npm run dev`), and the real-vs-mocked note from Section 5.
- **Deploy:** push to GitHub, import to Vercel, set the env var in the Vercel dashboard, deploy. Confirm the serverless function is reachable at `/api/parse` on the deployed URL.
- Include a couple of **sample resumes** in a `/samples` folder (varied layouts) so anyone — including a portfolio reviewer — can test it immediately without having their own resume handy.

---

## 7. Suggested build sequence (for Claude Code)

1. Scaffold Vite + React app; set up folder structure and `.gitignore`.
2. Build the three screens as static UI first (dummy data), so the flow is walkable before any parsing works.
3. Add client-side text extraction (pdf.js + mammoth); log extracted text to console to verify.
4. Build the `/api/parse` serverless function with the Gemini call and the extraction prompt; test locally with a pasted resume string.
5. Wire the frontend to `/api/parse`: file → text → API → parsed JSON → populate Screen 3.
6. Add robust error/edge handling (empty text, parse failure, rate limit) and the graceful-failure states.
7. Polish: loading messages, completeness indicator, chip inputs, editable fields, success state.
8. Write the README, add sample resumes, deploy to Vercel, verify the live serverless endpoint.

---

## 8. Acceptance check (how to know it's done)

- Upload any reasonable text-based PDF or DOCX resume → within a few seconds, Screen 3 shows the profile genuinely pre-filled with *that resume's* data, editable.
- Section headings do not bleed into field values; location from the header is captured; internships are separated from full-time roles.
- A broken/empty/scanned file produces a clear, non-dead-end error.
- The Gemini key is not present anywhere in the browser bundle or the GitHub repo.
- The live Vercel URL works end-to-end.

---

*Built as the interactive-prototype half of a product design case study. The parsing engine is feasibility evidence; the resume-first flow is the design argument.*

---

## Appendix A — Getting the free Gemini API key

The app needs one thing you must supply manually: a Google Gemini API key. It's free and takes a couple of minutes.

1. Go to **Google AI Studio** (aistudio.google.com) and sign in with a Google account.
2. Click **"Get API key"** (usually top-left or under the account menu) → **"Create API key"**.
3. Copy the key. This is the value that goes into `GEMINI_API_KEY`.

**Where the key goes (never commit it):**
- **Local development:** create a `.env` file in the project root with `GEMINI_API_KEY=your_key_here`. Confirm `.env` is in `.gitignore` so it is never pushed to GitHub.
- **Vercel (live deploy):** in the Vercel project dashboard → **Settings → Environment Variables** → add `GEMINI_API_KEY` with the key value → redeploy. The serverless function reads it from `process.env` at runtime; the browser never sees it.

**Free-tier notes:**
- The free tier has generous per-minute and per-day request limits — far above prototype/demo needs. You will not be charged as long as you stay on the free tier and don't enable billing.
- Use a **flash** model (e.g. `gemini-1.5-flash` or the current free flash model) — it's fast, cheap, and more than good enough for resume parsing. Avoid the pro models for this build; they're slower and can push you toward paid usage.
- If you ever hit a rate-limit error during a demo, it's the daily/minute cap, not a bug — the app's error handling (Section 3c / Screen 2) should already surface this readably.

> If Google's UI has changed and these exact labels differ, the thing you're looking for is any "create API key" option inside Google AI Studio — the key itself is what matters, not the path to it.
