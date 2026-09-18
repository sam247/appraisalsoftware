import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import sharp from "sharp";

for (const size of [16, 32, 48, 192, 512]) {
  const image = await sharp(`public/brand/icon-${size}.png`).metadata();
  assert.equal(image.width, size);
  assert.equal(image.height, size);
}
const apple = await sharp("src/app/apple-icon.png").metadata();
assert.equal(apple.width, 180);
assert.equal(apple.height, 180);
assert.equal(await readFile("src/app/icon.svg", "utf8"), await readFile("public/brand/app-icon.svg", "utf8"));
for (const name of ["wordmark", "wordmark-white", "mark", "mark-white", "app-icon"]) {
  const svg = await readFile(`public/brand/${name}.svg`, "utf8");
  assert.ok(!svg.includes("<text"), "Logos must not depend on installed fonts");
  assert.ok(svg.includes('aria-label="appraisal.software"'));
  assert.ok(svg.includes("#29a46c"));
}
const ico = await readFile("src/app/favicon.ico");
assert.equal(ico.readUInt16LE(2), 1);
assert.equal(ico.readUInt16LE(4), 3);
for (const [index, size] of [16, 32, 48].entries()) {
  const entry = 6 + index * 16;
  assert.equal(ico[entry], size);
  assert.equal(ico[entry + 1], size);
  const start = ico.readUInt32LE(entry + 12);
  const length = ico.readUInt32LE(entry + 8);
  assert.deepEqual(ico.subarray(start, start + length), await readFile(`public/brand/icon-${size}.png`));
}
console.log("Brand assets and icon sizes verified.");
