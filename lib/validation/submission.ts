export const MAX_SUBMISSION_BYTES = 10 * 1024 * 1024;
export const MAX_SUBMISSION_LABEL = "10 MB";

type AllowedType = { ext: string; mimes: string[] };

const ALLOWED_TYPES: AllowedType[] = [
  { ext: ".pdf", mimes: ["application/pdf"] },
  {
    ext: ".docx",
    mimes: [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
  },
];

// Some browsers/OSes send a generic mime for DOCX (or nothing at all); accept
// those and lean on the extension + canonical mime for the stored record.
const GENERIC_MIMES = new Set([
  "",
  "application/octet-stream",
  "binary/octet-stream",
]);

/** `accept` attribute for the file input. */
export const SUBMISSION_ACCEPT =
  ".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function matchByExtension(fileName: string): AllowedType | undefined {
  const lower = fileName.toLowerCase();
  return ALLOWED_TYPES.find((t) => lower.endsWith(t.ext));
}

/** Canonical mime for an accepted file, used for the DB record and download. */
export function canonicalMimeFor(fileName: string): string {
  return matchByExtension(fileName)?.mimes[0] ?? "application/octet-stream";
}

/**
 * Returns an error message if the file is not an acceptable submission, or null
 * if it passes. Enforced server-side; the client uses it only for fast feedback.
 */
export function validateSubmissionFile(file: {
  name: string;
  type: string;
  size: number;
}): string | null {
  if (!file.name || file.size <= 0) return "Choose a file to upload.";
  if (file.size > MAX_SUBMISSION_BYTES) {
    return `File is too large — the maximum is ${MAX_SUBMISSION_LABEL}.`;
  }
  const match = matchByExtension(file.name);
  if (!match) return "Only PDF or DOCX files are accepted.";

  const type = file.type.toLowerCase();
  if (!GENERIC_MIMES.has(type) && !match.mimes.includes(type)) {
    return "That file's type doesn't match its extension. Upload a genuine PDF or DOCX.";
  }
  return null;
}
