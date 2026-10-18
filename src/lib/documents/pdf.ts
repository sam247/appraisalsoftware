/**
 * PDF output via headless Chromium. Offline only (scripts and gated tests):
 * documents are generated when a pack changes and stored privately, never on a
 * request, so Chromium is a devDependency and is not bundled into the app.
 */
import { chromium } from "playwright-core";
import type { AppraisalDocument } from "./model";
import { printFooterTemplate, printHeaderTemplate, renderPrintHtml } from "./print-html";

/** Chromium location; defaults to the image's preinstalled browser. */
export function chromiumPath(): string {
  return process.env.DOCUMENTS_CHROMIUM_PATH ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
}

export async function renderPdf(doc: AppraisalDocument): Promise<Buffer> {
  const browser = await chromium.launch({ executablePath: chromiumPath() });
  try {
    const page = await browser.newPage();
    // No network: the HTML is self-contained, so nothing external can be fetched or tracked.
    await page.route("**/*", (route) => (route.request().url().startsWith("data:") ? route.continue() : route.abort()));
    await page.setContent(renderPrintHtml(doc), { waitUntil: "load" });
    return await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: true,
      headerTemplate: printHeaderTemplate(doc),
      footerTemplate: printFooterTemplate(doc),
      // Tagged PDF and an outline from the headings, for screen readers and navigation.
      tagged: true,
      outline: true,
    });
  } finally {
    await browser.close();
  }
}
