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
const legalPaths = ["/privacy", "/cookies"];
for (const path of legalPaths) assert(!urls.some((url) => url.pathname === path), "Legal pages stay outside the SEO sitemap");
for (const source of retired.keys()) assert(!urls.some((url) => url.pathname === source));

const publicUrls = [...urls, ...legalPaths.map((path) => new URL(path, urls[0].origin))];
const pages = await Promise.all(publicUrls.map(async (url) => {
  const response = await fetch(`${origin}${url.pathname}`, { redirect: "manual" });
  assert.equal(response.status, 200, url.pathname);
  const html = await response.text();
  assert(!/14.day trial|trial expiry|start free trial|trial ends|trial has ended/i.test(html), `${url.pathname}: obsolete trial proposition`);
  assert.equal([...html.matchAll(/<h1(?:\s|>)/g)].length, 1, `${url.pathname}: one H1`);
  const links = [...html.matchAll(/<link\b[^>]*>/g)].map((match) => attributes(match[0]));
  assert.equal(links.find((link) => link.rel === "canonical")?.href.replace(/\/$/, ""), url.href.replace(/\/$/, ""), `${url.pathname}: self canonical`);
  const metadata = [...html.matchAll(/<meta\b[^>]*>/g)].map((match) => attributes(match[0]));
  assert.equal(metadata.find((meta) => meta.name === "robots")?.content, legalPaths.includes(url.pathname) ? "noindex, follow" : "index, follow", `${url.pathname}: intended indexability`);
  assert(metadata.find((meta) => meta.name === "description")?.content, `${url.pathname}: description`);
  const image = metadata.find((meta) => meta.property === "og:image")?.content;
  assert(image, `${url.pathname}: sharing image`);
  assert.equal((await fetch(`${origin}${new URL(image).pathname}`)).status, 200, `${url.pathname}: sharing asset`);
  const schemas = [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs)].map((match) => JSON.parse(match[1]));
  for (const schema of schemas) for (const source of retired.keys()) assert(!JSON.stringify(schema).includes(source), `${url.pathname}: retired structured-data reference`);
  const header = html.match(/<header\b[^>]*>(.*?)<\/header>/s)?.[1];
  assert(header, `${url.pathname}: public header`);
  const headerHrefs = [...header.matchAll(/<a\b[^>]*>/g)].map((match) => attributes(match[0]).href);
  assert.equal(headerHrefs.length, 4, "Brand, pricing, sign in and Start Free only");
  for (const anchor of html.matchAll(/<a\b([^>]*)>(.*?)<\/a>/gs)) {
    const href = attributes(anchor[1]).href;
    if (!href || !/^https?:|^\//.test(href)) continue;
    if (new URL(href, url).pathname !== "/signup") continue;
    assert.equal(anchor[2].replace(/<[^>]*>/g, "").trim(), "Start Free", `${url.pathname}: signup CTA`);
  }
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
console.log(`Passed: ${urls.length} indexable pages and ${legalPaths.length} legal pages, ${checkedLinks} internal links/fragments, signup CTAs, header, metadata/sharing assets, structured data and both direct 301 redirects.`);
