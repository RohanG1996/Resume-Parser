# ResumeFirst

A working prototype built for a product design case study on Naukri's fresher onboarding. Naukri's real registration asks for name, email, password and work status first, and treats the resume as optional. Freshers are never asked for one at all. This prototype keeps Naukri's registration page largely as it is, with one change: the resume dropzone sits at the top of the form as its first field. Drop a resume in and the fields below fill themselves. The parsing is real, done by Gemini against whatever file you upload. If you don't have a resume handy, the familiar form is right there to fill by hand.

**The flow:** upload a resume on the registration page → the parse fills the form in place (work status is inferred, not asked) → Register → review the full pre-filled profile → confirm.

## Stack

- **Frontend:** Vite + React (JavaScript), plain CSS
- **Text extraction, in the browser:** `pdfjs-dist` for PDF, `mammoth` for DOCX, a small RTF stripper. For these formats the file never leaves the browser; only the extracted text goes to the API. Legacy `.doc` (Word 97–2003) is the exception, since no browser-side reader exists for it. Those files go to a second serverless function, [`api/extract-doc.js`](api/extract-doc.js), which uses `word-extractor` to return plain text and stores nothing.
- **Parsing:** Google Gemini (free tier, `gemini-2.5-flash`) behind a Vercel serverless function at [`api/parse.js`](api/parse.js). The function exists to keep the API key server-side.
- **Hosting:** Vercel, static frontend and serverless functions from the same repo. Costs nothing at this scale.

## Run locally

1. `npm install`
2. Copy `.env.example` to `.env` and paste in a Gemini API key. Keys are free at [aistudio.google.com](https://aistudio.google.com) under "Get API key" → "Create API key".
   ```
   GEMINI_API_KEY=your_key_here
   ```
3. `npm run dev`. The Vite dev server also serves the `/api` routes locally, so the full flow works without the Vercel CLI.
4. Test with the resumes in [`/samples`](samples). The PDFs can be regenerated with `npm run samples`.

## Deploy to Vercel

1. Push this repo to GitHub and import it in Vercel (framework preset: Vite).
2. In the Vercel dashboard, under **Settings → Environment Variables**, add `GEMINI_API_KEY`.
3. Deploy, then check the live URL end to end: upload a sample resume and confirm the review screen comes back pre-filled. That exercises `/api/parse` on the deployed function.

`.env` is gitignored. The key never appears in the frontend bundle or the repo.

## What's real vs. mocked

**Real:**
- File upload with drag-and-drop (PDF / DOCX / DOC / RTF, 2MB limit)
- Client-side text extraction
- Gemini parsing of any uploaded resume into structured fields: name, contact, location, headline, summary, work-status inference, skills, employment separated from internships, education, certifications, projects, languages
- The editable, pre-filled review screen. Its primary status is a recruiter-visibility threshold: the profile counts as visible once it has a headline, at least one skill, at least one education entry, a city, and a resume attached. The completeness score still exists but as a secondary indicator below that banner, and nothing in the UI prompts completion once the threshold is met.

**Mocked / out of scope:**
- No database, auth, OTP, or real account creation. "Confirm & create profile" shows a success state and stores nothing.
- No OCR for scanned or image-only PDFs. You get a clear error instead.
- No mobile-app view. Multi-language parsing only works to the extent Gemini handles it natively.

## Why it's built this way

A teardown of the real product (July 2026, three test accounts) found that freshers are never asked for a resume at registration, that the registration-time upload on the experienced path stores the file without parsing it, and that parsing only fires from a secondary entry point inside the profile page. When the parser does run, section headings bleed into field values, locations sitting in the resume header get missed, and saving can fail with an error that blames your internet connection.

This prototype takes the opposite bets: ask for the resume first, parse it at the moment of upload, and handle failures without dead-ending the user. The extraction prompt in [`api/parse.js`](api/parse.js) targets the specific parser gaps the teardown observed: heading bleed, missed header locations, and internships classified as employment.
