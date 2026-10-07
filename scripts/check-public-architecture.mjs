import assert from "node:assert/strict";

const origin = process.argv[2] ?? "http://localhost:3011";
const retired = new Map([
  ["/annual-appraisal-software", "/employee-appraisal-software"],
  ["/360-feedback-software", "/360-appraisals"],
]);
const attributes = (tag) => Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*["']([^"']*)["']/g)].map((match) => [match[1], match[2].replaceAll("&amp;", "&")]));
const response = await fetch(`${origin}/sitemap.xml`);
assert.equal(response.status, 200);
const sitemap = await response.text();
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => new URL(match[1]));
assert.equal(urls.length, 23, "22 core pages and one published article");
assert.equal(new Set(urls.map((url) => url.pathname)).size, urls.length);
for (const source of retired.keys()) assert(!urls.some((url) => url.pathname === source));

const pages = await Promise.all(urls.map(async (url) => {
  const response = await fetch(`${origin}${url.pathname}`, { redirect: "manual" });
  assert.equal(response.status, 200, url.pathname);
  const html = await response.text();
  assert.equal([...html.matchAll(/<h1(?:\s|>)/g)].length, 1, `${url.pathname}: one H1`);
  const links = [...html.matchAll(/<link\b[^>]*>/g)].map((match) => attributes(match[0]));
  assert.equal(links.find((link) => link.rel === "canonical")?.href.replace(/\/$/, ""), url.href.replace(/\/$/, ""), `${url.pathname}: self canonical`);
  const metadata = [...html.matchAll(/<meta\b[^>]*>/g)].map((match) => attributes(match[0]));
  assert.equal(metadata.find((meta) => meta.name === "robots")?.content, "index, follow", `${url.pathname}: indexable production build`);
  assert(metadata.find((meta) => meta.name === "description")?.content, `${url.pathname}: description`);
  const image = metadata.find((meta) => meta.property === "og:image")?.content;
  assert(image, `${url.pathname}: sharing image`);
  assert.equal((await fetch(`${origin}${new URL(image).pathname}`)).status, 200, `${url.pathname}: sharing asset`);
  const schemas = [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs)].map((match) => JSON.parse(match[1]));
  for (const schema of schemas) for (const source of retired.keys()) assert(!JSON.stringify(schema).includes(source), `${url.pathname}: retired structured-data reference`);
  return { path: url.pathname, url, html, anchors: new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1])) };
}));
const byPath = new Map(pages.map((page) => [page.path, page]));
let checkedLinks = 0;
for (const page of pages) {
  for (const match of page.html.matchAll(/<a\b[^>]*>/g)) {
    const href = attributes(match[0]).href;
    if (!href || !/^(?:\/|#|https?:)/.test(href)) continue;
    const url = new URL(href, page.url);
    if (![page.url.origin, origin].includes(url.origin)) continue;
    assert(!retired.has(url.pathname), `${page.path}: link to retired ${url.pathname}`);
    const target = byPath.get(url.pathname);
    assert(target, `${page.path}: unknown public link ${href}`);
    if (url.hash) assert(target.anchors.has(decodeURIComponent(url.hash.slice(1))), `${page.path}: missing anchor ${href}`);
    checkedLinks++;
  }
}
for (const [source, destination] of retired) {
  const result = await fetch(`${origin}${source}?source=architecture-check`, { redirect: "manual" });
  assert.equal(result.status, 301, source);
  const location = new URL(result.headers.get("location"), origin);
  assert.equal(location.pathname, destination);
  assert.equal(location.search, "?source=architecture-check");
  assert.equal((await fetch(location, { redirect: "manual" })).status, 200, `${source}: direct destination`);
}
assert(byPath.get("/360-appraisals").anchors.has("privacy"));
console.log(`Passed: ${pages.length} indexable pages, ${checkedLinks} internal links/fragments, metadata/sharing assets, structured data and both direct 301 redirects.`);
