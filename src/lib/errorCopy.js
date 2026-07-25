// Translates internal errors into user-facing copy. It never exposes raw
// exception text, file paths, or URLs. Kept dependency-free (it duck-types on
// error.name / error.kind rather than importing the error classes) so it can
// load eagerly without dragging in the lazy-loaded extraction chunk.

const OUR_SIDE =
  "Something went wrong on our side. This usually fixes itself, so try again in a moment.";

const CANT_BUILD =
  "We couldn't build your profile from this file. Try again, or fill the form below.";

const CANT_READ =
  "We couldn't read any text from this file. If it's a scanned image, try a different file or fill the form below.";

const RATE_LIMIT =
  "We're getting a lot of requests right now. Wait a moment and try again.";

// Returns { message, refresh } — `refresh` marks errors a page reload can fix
// (a stale deployment serving a chunk URL that no longer exists).
export function describeError(err) {
  const name = err?.name;
  const kind = err?.kind;

  // Failure loading the extraction module — usually a stale deploy.
  if (kind === "moduleLoad") return { message: OUR_SIDE, refresh: true };

  if (name === "ExtractionError") {
    if (kind === "empty") return { message: CANT_READ };
    // oversized / unsupported / unreadable already carry plain, safe,
    // actionable copy we wrote, so pass those through unchanged.
    return { message: err.message };
  }

  if (name === "ParseError") {
    if (kind === "network") return { message: OUR_SIDE };
    if (kind === "rateLimit") return { message: RATE_LIMIT };
    return { message: CANT_BUILD };
  }

  // Untagged dynamic-import / network failures that slipped through.
  if (isChunkLoadError(err)) return { message: OUR_SIDE, refresh: true };

  // Anything else: never leak the raw text.
  return { message: CANT_BUILD };
}

function isChunkLoadError(err) {
  const msg = String(err?.message || "");
  return (
    /dynamically imported module/i.test(msg) ||
    /importing a module script failed/i.test(msg) ||
    /failed to fetch/i.test(msg) ||
    /error loading/i.test(msg)
  );
}
