/**
 * Editable Word (.docx) output. Response areas are table cells people type
 * into, ratings are real Word checkbox controls, and headings use Word's
 * built-in styles so the navigation pane and screen readers work.
 */
import {
  AlignmentType,
  BorderStyle,
  CheckBox,
  Document,
  Footer,
  Header,
  HeadingLevel,
  HeightRule,
  Packer,
  PageBreak,
  PageNumber,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import { BRAND, type AppraisalDocument, type DocumentQuestion } from "./model";

const GREEN = "1F6B4A";
const MUTED = "4B5550";
const LINE = "8A948F";
// A4 in twentieths of a point, with 18mm side margins.
const PAGE = { width: 11906, height: 16838 };
const MARGIN = { top: 1247, bottom: 1361, left: 1020, right: 1020, header: 567, footer: 567 };
const CONTENT_WIDTH = PAGE.width - MARGIN.left - MARGIN.right;
const MM = 56.7;

const cellBorder = { style: BorderStyle.SINGLE, size: 4, color: LINE };
const borders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };

function text(value: string, options: { bold?: boolean; size?: number; color?: string; italics?: boolean } = {}): TextRun {
  return new TextRun({ text: value, ...options });
}

/** A typed-into response area of roughly `lines` handwritten lines when printed; the label paragraph above names it. */
function responseBox(lines: number): Table {
  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: [CONTENT_WIDTH],
    rows: [
      new TableRow({
        height: { value: Math.round(lines * 8 * MM), rule: HeightRule.ATLEAST },
        cantSplit: true,
        children: [new TableCell({ borders, children: [new Paragraph({ children: [] })] })],
      }),
    ],
  });
}

// Word's default checkbox font (MS Gothic) renders as ticked in LibreOffice when missing.
const CHECKBOX_FONT = "Segoe UI Symbol";

function ratingLine(who: string, q: DocumentQuestion): Paragraph {
  const boxes = [1, 2, 3, 4, 5].flatMap((n) => [
    new CheckBox({
      alias: `${who} rating ${n}`,
      checkedState: { value: "2612", font: CHECKBOX_FONT },
      uncheckedState: { value: "2610", font: CHECKBOX_FONT },
    }),
    text(` ${n}    `),
  ]);
  return new Paragraph({
    keepNext: true,
    spacing: { before: 60, after: 60 },
    children: [text(`${who}   `, { bold: true, size: 18 }), ...boxes, text(`1 = ${q.scale!.min_label} · 5 = ${q.scale!.max_label}`, { size: 17, color: MUTED })],
  });
}

function label(value: string): Paragraph {
  return new Paragraph({ keepNext: true, spacing: { before: 160, after: 40 }, children: [text(value, { bold: true, size: 18 })] });
}

function question(q: DocumentQuestion): (Paragraph | Table)[] {
  const parts: (Paragraph | Table)[] = [
    new Paragraph({
      keepNext: true,
      keepLines: true,
      spacing: { before: 240, after: 40 },
      children: [text(`${q.number}. `, { bold: true, color: GREEN }), text(q.prompt, { bold: true }), ...(q.required ? [] : [text(" (optional)", { color: MUTED })])],
    }),
  ];
  if (q.help) parts.push(new Paragraph({ keepNext: true, spacing: { after: 60 }, children: [text(q.help, { size: 18, color: MUTED })] }));
  if (q.type === "rating") parts.push(ratingLine("Employee", q), ratingLine("Manager", q), label("Evidence or examples"), responseBox(3));
  else parts.push(label("Employee"), responseBox(4), label("Manager"), responseBox(4));
  return parts;
}

const NONE = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };

/**
 * Label + fill-in line pairs. A table, because Word merges identical borders on
 * consecutive paragraphs into one line.
 */
function fields(names: string[]): Table {
  const labelWidth = 2600;
  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: [labelWidth, CONTENT_WIDTH - labelWidth],
    borders: { top: NONE, bottom: NONE, left: NONE, right: NONE, insideHorizontal: NONE, insideVertical: NONE },
    // keepNext on every row but the last holds the group on one page.
    rows: names.map(
      (name, i) =>
        new TableRow({
          height: { value: Math.round(10 * MM), rule: HeightRule.ATLEAST },
          cantSplit: true,
          children: [
            new TableCell({ borders: { top: NONE, bottom: NONE, left: NONE, right: NONE }, verticalAlign: "bottom", width: { size: labelWidth, type: WidthType.DXA }, children: [new Paragraph({ keepNext: i < names.length - 1, children: [text(name, { bold: true })] })] }),
            new TableCell({ borders: { top: NONE, left: NONE, right: NONE, bottom: cellBorder }, verticalAlign: "bottom", width: { size: CONTENT_WIDTH - labelWidth, type: WidthType.DXA }, children: [new Paragraph({ keepNext: i < names.length - 1, children: [] })] }),
          ],
        }),
    ),
  });
}

function planTable(headers: string[], rows: number): Table {
  const width = Math.floor(CONTENT_WIDTH / headers.length);
  const cell = (children: Paragraph[]) => new TableCell({ borders, width: { size: width, type: WidthType.DXA }, children });
  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: headers.map(() => width),
    rows: [
      new TableRow({ tableHeader: true, children: headers.map((h) => cell([new Paragraph({ children: [text(h, { bold: true, size: 18 })] })])) }),
      ...Array.from({ length: rows }, () => new TableRow({ height: { value: Math.round(14 * MM), rule: HeightRule.ATLEAST }, cantSplit: true, children: headers.map(() => cell([new Paragraph({ children: [] })])) })),
    ],
  });
}

function cover(doc: AppraisalDocument): Paragraph[] {
  const row = (term: string, value: string) =>
    new Paragraph({ spacing: { after: 100 }, children: [text(`${term}: `, { bold: true }), text(value)] });
  return [
    new Paragraph({ spacing: { before: 1600, after: 120 }, children: [text("APPRAISAL TEMPLATE", { bold: true, size: 18, color: GREEN })] }),
    new Paragraph({ heading: HeadingLevel.TITLE, spacing: { after: 240 }, children: [text(doc.title)] }),
    new Paragraph({ spacing: { after: 360 }, children: [text(doc.summary)] }),
    row("Intended for", doc.audience),
    ...(doc.basis ? [row("Regulatory basis", doc.basis)] : []),
    row("Written for", doc.nations),
    row("Last reviewed", doc.reviewed),
    row("Version", `${doc.versionLabel} (pack version ${doc.packVersion}, document revision ${doc.documentRevision})`),
    new Paragraph({
      spacing: { before: 360 },
      border: { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder },
      children: [text(doc.disclaimer, { size: 18, color: MUTED })],
    }),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

export function buildDocx(doc: AppraisalDocument): Document {
  const body: (Paragraph | Table)[] = [
    ...cover(doc),
    new Paragraph({ heading: HeadingLevel.HEADING_1, children: [text("Review details")] }),
    fields(doc.recordFields),
    new Paragraph({ heading: HeadingLevel.HEADING_1, children: [text("How to rate")] }),
    ...doc.scales.map((s) => new Paragraph({ bullet: { level: 0 }, children: [text(`1 = ${s.min_label}, 5 = ${s.max_label}. Use 2–4 for the points in between.`)] })),
    ...doc.sections.flatMap((s) => [new Paragraph({ heading: HeadingLevel.HEADING_1, keepNext: true, children: [text(s.title)] }), ...s.questions.flatMap(question)]),
    new Paragraph({ heading: HeadingLevel.HEADING_1, children: [text("Development plan")] }),
    label("Development objectives"),
    planTable(doc.planning.objectives, 3),
    label("Agreed actions"),
    planTable(doc.planning.actions, 4),
    fields(["Follow-up date"]),
    new Paragraph({ heading: HeadingLevel.HEADING_1, children: [text("Sign-off")] }),
    ...doc.signOff.flatMap((who) => [label(who), fields(["Name", "Signature", "Date"])]),
  ];

  return new Document({
    title: doc.metadata.title,
    subject: doc.metadata.subject,
    creator: doc.metadata.creator,
    lastModifiedBy: BRAND,
    keywords: doc.metadata.keywords.join(", "),
    description: doc.disclaimer,
    revision: doc.documentRevision,
    styles: {
      default: {
        document: { run: { font: "Arial", size: 21 } },
        title: { run: { font: "Arial", size: 48, bold: true } },
        heading1: { run: { font: "Arial", size: 26, bold: true, color: "14432F" }, paragraph: { spacing: { before: 360, after: 120 } } },
      },
    },
    sections: [
      {
        properties: { page: { size: PAGE, margin: MARGIN } },
        headers: {
          default: new Header({
            children: [new Paragraph({ children: [text(`${BRAND} · ${doc.title} · ${doc.versionLabel}`, { size: 15, color: MUTED })] })],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({ children: [text(doc.footer, { size: 15, color: MUTED })] }),
              new Paragraph({ children: [text(doc.disclaimer, { size: 14, color: MUTED })] }),
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [new TextRun({ children: ["Page ", PageNumber.CURRENT, " of ", PageNumber.TOTAL_PAGES], size: 15, color: MUTED })],
              }),
            ],
          }),
        },
        children: body,
      },
    ],
  });
}

export async function renderDocx(doc: AppraisalDocument): Promise<Buffer> {
  return Packer.toBuffer(buildDocx(doc));
}
