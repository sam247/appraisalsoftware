/**
 * Minimal people CSV parser: email (required), full_name, job_title.
 * Header names are matched case-insensitively; synonyms accepted.
 */

export type PeopleCsvRow = {
  email: string;
  full_name: string | null;
  job_title: string | null;
  line: number;
};

export type PeopleCsvResult = {
  rows: PeopleCsvRow[];
  errors: string[];
};

const EMAIL_HEADERS = new Set(["email", "e-mail", "email address", "work email"]);
const NAME_HEADERS = new Set([
  "full_name",
  "fullname",
  "full name",
  "employee name",
  "display name",
]);
const TITLE_HEADERS = new Set([
  "job_title",
  "title",
  "job title",
  "role",
  "position",
]);

const MAX_ROWS = 500;

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      cells.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  cells.push(cur.trim());
  return cells;
}

function colIndex(headers: string[], aliases: Set<string>): number {
  return headers.findIndex((h) => aliases.has(h));
}

export function parsePeopleCsv(text: string): PeopleCsvResult {
  const errors: string[] = [];
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((l) => l.trimEnd())
    .filter((l) => l.length > 0);

  if (!lines.length) {
    return { rows: [], errors: ["CSV is empty"] };
  }

  const headers = splitCsvLine(lines[0]!).map((h) => h.toLowerCase());
  const emailIdx = colIndex(headers, EMAIL_HEADERS);
  if (emailIdx < 0) {
    return { rows: [], errors: ["CSV needs an email column"] };
  }
  const nameIdx = colIndex(headers, NAME_HEADERS);
  const titleIdx = colIndex(headers, TITLE_HEADERS);

  const rows: PeopleCsvRow[] = [];
  const seen = new Set<string>();

  for (let i = 1; i < lines.length; i++) {
    if (rows.length >= MAX_ROWS) {
      errors.push(`Stopped at ${MAX_ROWS} rows (limit)`);
      break;
    }
    const cells = splitCsvLine(lines[i]!);
    const email = (cells[emailIdx] ?? "").trim().toLowerCase();
    const line = i + 1;
    if (!email) {
      errors.push(`Line ${line}: missing email`);
      continue;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push(`Line ${line}: invalid email`);
      continue;
    }
    if (seen.has(email)) {
      errors.push(`Line ${line}: duplicate email in file`);
      continue;
    }
    seen.add(email);
    rows.push({
      email,
      full_name:
        nameIdx >= 0
          ? (cells[nameIdx] ?? "").trim() || null
          : null,
      job_title:
        titleIdx >= 0
          ? (cells[titleIdx] ?? "").trim() || null
          : null,
      line,
    });
  }

  return { rows, errors };
}
