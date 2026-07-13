// Sends extracted resume text to the serverless function and returns structured JSON.

export class ParseError extends Error {}

export async function parseResume(resumeText) {
  let res;
  try {
    res = await fetch("/api/parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resumeText }),
    });
  } catch {
    throw new ParseError("We couldn't reach the server. Check your connection and try again.");
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    /* fall through to the generic error below */
  }

  if (!res.ok) {
    throw new ParseError(data?.error || "Something went wrong while reading your resume. Please try again.");
  }
  return data;
}
