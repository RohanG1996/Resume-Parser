// Sends extracted resume text to the serverless function and returns structured JSON.

export class ParseError extends Error {
  // kind: "network" | "api" | "rateLimit"
  constructor(message, kind = "api") {
    super(message);
    this.name = "ParseError";
    this.kind = kind;
  }
}

export async function parseResume(resumeText) {
  let res;
  try {
    res = await fetch("/api/parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resumeText }),
    });
  } catch {
    throw new ParseError("We couldn't reach the server. Check your connection and try again.", "network");
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    /* fall through to the generic error below */
  }

  if (!res.ok) {
    throw new ParseError(
      data?.error || "Something went wrong while reading your resume. Please try again.",
      data?.code === "rate_limit" ? "rateLimit" : "api"
    );
  }
  return data;
}
