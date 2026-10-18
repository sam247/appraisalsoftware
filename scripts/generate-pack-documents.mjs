#!/usr/bin/env node
// Local review copies of downloadable pack documents. Usage:
//   node scripts/generate-pack-documents.mjs [slug ...]
// Output goes to .generated/documents (gitignored). Never upload these files.
import { createJiti } from "jiti";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const jiti = createJiti(import.meta.url, { alias: { "@": path.join(root, "src") } });
const { generatePackDocuments } = await jiti.import(path.join(root, "src/lib/documents/generate.ts"));
const files = await generatePackDocuments(path.join(root, ".generated/documents"), process.argv.slice(2).length ? process.argv.slice(2) : undefined);
for (const file of files) console.log(path.relative(root, file));
