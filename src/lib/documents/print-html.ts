/**
 * Printable A4 HTML for an appraisal document. Chromium prints it to PDF
 * (./pdf.ts); headers and footers come from the print templates so they repeat
 * on every page. Pure string output, so it is testable without a browser.
 * Arial-metric TrueType fonts only: Chromium embeds OpenType/CFF fonts as
 * Type 3, which prints and reads less well.
 */
import { BRAND, type AppraisalDocument, type DocumentQuestion } from "./model";

const RATINGS = [1, 2, 3, 4, 5];

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

const e = escapeHtml;

function lines(count: number, label: string): string {
  return `<div class="write" style="--lines:${count}" role="img" aria-label="${e(label)}"></div>`;
}

function ratingRow(who: string, q: DocumentQuestion): string {
  const boxes = RATINGS.map((n) => `<span class="box" aria-hidden="true">${n}</span>`).join("");
  return `<div class="rating"><span class="who">${who}</span><span class="boxes">${boxes}</span><span class="ends">1 = ${e(q.scale!.min_label)} · 5 = ${e(q.scale!.max_label)}</span></div>`;
}

function question(q: DocumentQuestion): string {
  const head = `<p class="prompt"><span class="num">${q.number}.</span> ${e(q.prompt)}${q.required ? "" : ' <span class="optional">(optional)</span>'}</p>${q.help ? `<p class="help">${e(q.help)}</p>` : ""}`;
  const body =
    q.type === "rating"
      ? `${ratingRow("Employee", q)}${ratingRow("Manager", q)}<p class="label">Evidence or examples</p>${lines(3, "Space for evidence or examples")}`
      : `<p class="label">Employee</p>${lines(4, "Space for the employee's response")}<p class="label">Manager</p>${lines(4, "Space for the manager's response")}`;
  return `<section class="question">${head}${body}</section>`;
}

function table(headers: string[], rows: number, caption: string): string {
  const head = headers.map((h) => `<th scope="col">${e(h)}</th>`).join("");
  const blank = `<tr>${headers.map(() => "<td></td>").join("")}</tr>`.repeat(rows);
  return `<table><caption>${e(caption)}</caption><thead><tr>${head}</tr></thead><tbody>${blank}</tbody></table>`;
}

export function renderPrintHtml(doc: AppraisalDocument): string {
  const scaleKey = doc.scales
    .map((s) => `<li>1 = ${e(s.min_label)}, 5 = ${e(s.max_label)}. Use 2–4 for the points in between.</li>`)
    .join("");
  const record = doc.recordFields.map((f) => `<div class="field"><span>${e(f)}</span><span class="fill"></span></div>`).join("");
  const sections = doc.sections
    .map((s) => `<h2>${e(s.title)}</h2>${s.questions.map(question).join("")}`)
    .join("");
  const signOff = doc.signOff
    .map((who) => `<div class="sign"><p class="label">${e(who)}</p><div class="field"><span>Name</span><span class="fill"></span></div><div class="field"><span>Signature</span><span class="fill"></span></div><div class="field"><span>Date</span><span class="fill"></span></div></div>`)
    .join("");

  return `<!doctype html>
<html lang="${doc.metadata.language}">
<head>
<meta charset="utf-8">
<title>${e(doc.metadata.title)}</title>
<meta name="author" content="${e(BRAND)}">
<meta name="description" content="${e(doc.metadata.subject)}">
<meta name="keywords" content="${e(doc.metadata.keywords.join(", "))}">
<style>
  @page { size: A4; margin: 22mm 18mm 24mm; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: Arial, "Liberation Sans", "Helvetica Neue", sans-serif; font-size: 10.5pt; line-height: 1.45; color: #1b1f1d; }
  h1 { font-size: 24pt; line-height: 1.15; margin: 0 0 6mm; }
  h2 { font-size: 13pt; margin: 8mm 0 3mm; padding-bottom: 1.5mm; border-bottom: 0.4mm solid #1f6b4a; color: #14432f; break-after: avoid; }
  .cover { break-after: page; }
  .cover .eyebrow { font-size: 10pt; color: #1f6b4a; font-weight: 600; margin: 30mm 0 4mm; }
  .cover dl { display: grid; grid-template-columns: 38mm 1fr; gap: 2.5mm 6mm; margin: 10mm 0; }
  .cover dt { font-weight: 600; } .cover dd { margin: 0; }
  .notice { border: 0.3mm solid #c9d3cd; border-radius: 2mm; padding: 4mm; font-size: 9pt; color: #3e4743; }
  .field { display: flex; gap: 3mm; align-items: flex-end; margin: 2.5mm 0; }
  .field > span:first-child { min-width: 30mm; font-weight: 600; }
  .fill { flex: 1; border-bottom: 0.3mm solid #8a948f; height: 7mm; }
  .question { break-inside: avoid; margin: 0 0 6mm; }
  .prompt { font-weight: 600; margin: 0 0 1mm; } .num { color: #1f6b4a; }
  .help { margin: 0 0 2mm; font-size: 9pt; color: #4b5550; }
  .optional { font-weight: 400; color: #4b5550; }
  .rating { display: flex; align-items: center; gap: 4mm; margin: 1.5mm 0; }
  .who { width: 20mm; font-size: 9pt; font-weight: 600; }
  .boxes { display: flex; gap: 2mm; }
  .box { width: 8mm; height: 8mm; border: 0.3mm solid #5f6964; border-radius: 1mm; display: inline-flex; align-items: center; justify-content: center; font-size: 8pt; color: #5f6964; }
  .ends { font-size: 8.5pt; color: #4b5550; }
  .label { font-size: 9pt; font-weight: 600; margin: 2mm 0 1mm; }
  .write { height: calc(var(--lines) * 8mm); background-image: repeating-linear-gradient(to bottom, transparent 0, transparent calc(8mm - 0.25mm), #b9c2bd calc(8mm - 0.25mm), #b9c2bd 8mm); }
  table { width: 100%; border-collapse: collapse; margin: 2mm 0 6mm; break-inside: avoid; }
  caption { text-align: left; font-weight: 600; margin-bottom: 2mm; }
  th, td { border: 0.3mm solid #8a948f; padding: 2mm; text-align: left; font-size: 9pt; }
  td { height: 14mm; }
  .sign-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10mm; break-inside: avoid; }
</style>
</head>
<body>
<section class="cover">
  <p class="eyebrow">Appraisal template</p>
  <h1>${e(doc.title)}</h1>
  <p>${e(doc.summary)}</p>
  <dl>
    <dt>Intended for</dt><dd>${e(doc.audience)}</dd>
    ${doc.basis ? `<dt>Regulatory basis</dt><dd>${e(doc.basis)}</dd>` : ""}
    <dt>Written for</dt><dd>${e(doc.nations)}</dd>
    <dt>Last reviewed</dt><dd>${e(doc.reviewed)}</dd>
    <dt>Version</dt><dd>${e(doc.versionLabel)} (pack version ${doc.packVersion}, document revision ${doc.documentRevision})</dd>
  </dl>
  <p class="notice">${e(doc.disclaimer)}</p>
</section>
<main>
  <h2>Review details</h2>
  ${record}
  <h2>How to rate</h2>
  <ul>${scaleKey}</ul>
  ${sections}
  <h2>Development plan</h2>
  ${table(doc.planning.objectives, 3, "Development objectives")}
  ${table(doc.planning.actions, 4, "Agreed actions")}
  <div class="field"><span>Follow-up date</span><span class="fill"></span></div>
  <h2>Sign-off</h2>
  <div class="sign-grid">${signOff}</div>
</main>
</body>
</html>`;
}

/** Footer repeated on every printed page (Chromium print template). */
export function printFooterTemplate(doc: AppraisalDocument): string {
  return `<div style="width:100%;font-family:Arial,'Liberation Sans',sans-serif;font-size:7pt;color:#4b5550;padding:0 18mm;display:flex;justify-content:space-between;gap:6mm"><span>${e(doc.footer)} · ${e(doc.disclaimer)}</span><span style="white-space:nowrap">Page <span class="pageNumber"></span> of <span class="totalPages"></span></span></div>`;
}

export function printHeaderTemplate(doc: AppraisalDocument): string {
  return `<div style="width:100%;font-family:Arial,'Liberation Sans',sans-serif;font-size:7pt;color:#4b5550;padding:0 18mm;display:flex;justify-content:space-between"><span>${e(BRAND)}</span><span>${e(doc.title)} · ${e(doc.versionLabel)}</span></div>`;
}
