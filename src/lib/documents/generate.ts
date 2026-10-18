/**
 * Builds the Word and PDF files for packs offered as downloads. Offline only:
 * writes to a local folder for review; nothing is uploaded or published.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { packBySlug } from "../marketplace";
import { DOWNLOADS, documentVersionLabel, downloadFor } from "../marketplace/downloads";
import { renderDocx } from "./docx";
import { buildAppraisalDocument } from "./model";
import { renderPdf } from "./pdf";

export async function generatePackDocuments(outDir: string, slugs: string[] = Object.keys(DOWNLOADS)): Promise<string[]> {
  const written: string[] = [];
  for (const slug of slugs) {
    const pack = packBySlug(slug);
    const product = pack ? downloadFor(pack) : null;
    if (!pack || !product) throw new Error(`${slug} is not configured as a download`);
    const doc = buildAppraisalDocument(pack, product);
    const dir = path.join(outDir, slug, documentVersionLabel(product));
    await mkdir(dir, { recursive: true });
    for (const format of product.formats) {
      const file = path.join(dir, `${slug}-${documentVersionLabel(product)}.${format}`);
      await writeFile(file, format === "docx" ? await renderDocx(doc) : await renderPdf(doc));
      written.push(file);
    }
  }
  return written;
}
