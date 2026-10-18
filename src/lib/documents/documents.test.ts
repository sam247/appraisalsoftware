import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import { packBySlug, packs, REGULATORY_DISCLAIMER } from "@/lib/marketplace";
import { AGREE } from "@/lib/marketplace/scales";
import { downloadFor } from "@/lib/marketplace/downloads";
import { renderDocx } from "./docx";
import { buildAppraisalDocument, documentQuestions } from "./model";
import { chromiumPath } from "./pdf";
import { escapeHtml, renderPrintHtml } from "./print-html";

const downloadable = packs.filter((p) => downloadFor(p));
const docFor = (slug: string) => {
  const pack = packBySlug(slug)!;
  return buildAppraisalDocument(pack, downloadFor(pack)!);
};
const xmlEscape = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c]!);
/** Asserts each needle appears after the previous one. */
function expectInOrder(haystack: string, needles: string[]) {
  let at = -1;
  for (const needle of needles) {
    const next = haystack.indexOf(needle, at + 1);
    expect(next, `"${needle.slice(0, 40)}" after position ${at}`).toBeGreaterThan(at);
    at = next;
  }
}

describe("document model", () => {
  it("uses the canonical pack questions, in order, with scales and areas", () => {
    expect(downloadable.length).toBeGreaterThan(0);
    for (const pack of downloadable) {
      const doc = buildAppraisalDocument(pack, downloadFor(pack)!);
      const questions = documentQuestions(doc);
      expect(questions.map((q) => q.prompt)).toEqual(pack.questions.map((q) => q.prompt));
      expect(questions.map((q) => q.number)).toEqual(pack.questions.map((_, i) => i + 1));
      pack.questions.forEach((q, i) => {
        expect(questions[i].type).toBe(q.type);
        expect(questions[i].required).toBe(q.required ?? true);
        expect(questions[i].scale).toEqual(q.type === "rating" ? (q.scale ?? AGREE) : null);
      });
      for (const section of doc.sections.filter((s) => s.area))
        for (const q of section.questions) expect(pack.questions[q.number - 1].area ?? "General").toBe(section.area);
      expect(doc.packVersion).toBe(pack.version);
      expect(doc.versionLabel).toBe(`v${pack.version}.1`);
      expect(doc.disclaimer).toBe(REGULATORY_DISCLAIMER);
      expect(doc.basis).toBe(pack.basis ?? null);
    }
  });

  it("identifies pack and version but carries no order reference or buyer details", () => {
    const html = renderPrintHtml(docFor("eyfs-supervision-pack")).replace(/<style>[\s\S]*?<\/style>/, "");
    expect(html).toContain("EYFS Supervision &amp; Practitioner Appraisal");
    expect(html).toContain("v1.1");
    expect(html).not.toMatch(/\b(order (number|reference|ref)|invoice|receipt|licensed to|purchased by)\b|@\w/i);
  });

  it("refuses a product built for another pack or version", () => {
    const care = packBySlug("care-worker-appraisal-pack")!;
    const product = downloadFor(care)!;
    expect(() => buildAppraisalDocument(packBySlug("eyfs-supervision-pack")!, product)).toThrow();
    expect(() => buildAppraisalDocument(care, { ...product, packVersion: 99 })).toThrow();
  });
});

describe("print HTML", () => {
  it("escapes special characters", () => {
    expect(escapeHtml(`SM&CR <b>"x"</b> 'y'`)).toBe("SM&amp;CR &lt;b&gt;&quot;x&quot;&lt;/b&gt; &#39;y&#39;");
    const html = renderPrintHtml(docFor("care-worker-appraisal-pack"));
    expect(html).toContain("<title>Care Worker Appraisal &amp; Supervision (CQC) (v1.1)</title>");
    expect(html).not.toMatch(/Appraisal & Supervision/);
  });

  it("contains every question in order, the version, nations, basis and disclaimer, and no external resources", () => {
    for (const pack of downloadable) {
      const doc = buildAppraisalDocument(pack, downloadFor(pack)!);
      const html = renderPrintHtml(doc);
      expectInOrder(html, pack.questions.map((q) => escapeHtml(q.prompt)));
      expect(html).toContain(escapeHtml(doc.versionLabel));
      expect(html).toContain(escapeHtml(doc.nations));
      expect(html).toContain(escapeHtml(REGULATORY_DISCLAIMER));
      if (pack.basis) expect(html).toContain(escapeHtml(pack.basis));
      expect(html).not.toMatch(/<(script|link|img)\b|url\(/i);
      expect(html).toContain('lang="en-GB"');
    }
  });
});

describe("Word document", () => {
  it("is a valid .docx with every question in order, real checkboxes and version details", async () => {
    const pack = packBySlug("care-worker-appraisal-pack")!;
    const doc = docFor(pack.slug);
    const zip = await JSZip.loadAsync(await renderDocx(doc));
    const body = await zip.file("word/document.xml")!.async("string");
    expectInOrder(body, pack.questions.map((q) => xmlEscape(q.prompt)));
    const ratings = pack.questions.filter((q) => q.type === "rating").length;
    // Employee and manager rows, five boxes each.
    expect(body.match(/<w14:checkbox>/g)?.length).toBe(ratings * 2 * 5);
    expect(body).not.toContain('w14:val="1"');
    const core = await zip.file("docProps/core.xml")!.async("string");
    expect(core).toContain("<dc:title>Care Worker Appraisal &amp; Supervision (CQC) (v1.1)</dc:title>");
    expect(core).toContain("<dc:creator>Appraisal Software</dc:creator>");
    const footers = await Promise.all(Object.keys(zip.files).filter((f) => /word\/footer\d*\.xml/.test(f)).map((f) => zip.file(f)!.async("string")));
    expect(footers.join("")).toContain("v1.1");
    expect(footers.join("")).toContain(xmlEscape(REGULATORY_DISCLAIMER));
    const styles = await zip.file("word/styles.xml")!.async("string");
    expect(styles).toContain("Heading1");
  });
});

const canPrint = existsSync(chromiumPath()) && (() => {
  try {
    execFileSync("pdftotext", ["-v"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
})();

describe.skipIf(!canPrint)("PDF (needs Chromium and poppler)", () => {
  it("is tagged A4 with extractable text in question order and embedded TrueType fonts", async () => {
    const { renderPdf } = await import("./pdf");
    const pack = packBySlug("childrens-home-appraisal-pack")!;
    const file = path.join(mkdtempSync(path.join(tmpdir(), "pack-pdf-")), "pack.pdf");
    writeFileSync(file, await renderPdf(docFor(pack.slug)));
    const info = execFileSync("pdfinfo", [file]).toString();
    expect(info).toMatch(/Tagged:\s+yes/);
    expect(info).toMatch(/Page size:\s+59\d\.\d+ x 84\d\.\d+ pts \(A4\)/);
    expect(info).toContain("Children's Home Annual Appraisal & Supervision (v1.1)");
    const text = execFileSync("pdftotext", [file, "-"]).toString().replace(/\s+/g, " ");
    expectInOrder(text, pack.questions.map((q) => q.prompt.replace(/\s+/g, " ").slice(0, 45)));
    expect(text).toContain("Page 1 of");
    const fonts = execFileSync("pdffonts", [file]).toString();
    expect(fonts).not.toMatch(/Type 3/);
  }, 60_000);
});
