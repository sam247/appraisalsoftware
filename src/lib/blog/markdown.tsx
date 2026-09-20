import type { ReactNode } from "react";
import { createElement, Fragment } from "react";
import Link from "next/link";

type Token =
  | { type: "heading"; level: 2 | 3 | 4; text: string }
  | { type: "paragraph"; text: string }
  | { type: "blockquote"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "hr" }
  | { type: "callout"; text: string };

function inline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern =
    /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) {
      nodes.push(text.slice(last, match.index));
    }
    const token = match[0];
    const key = `${keyPrefix}-${i++}`;
    if (token.startsWith("**")) {
      nodes.push(createElement("strong", { key }, token.slice(2, -2)));
    } else if (token.startsWith("*")) {
      nodes.push(createElement("em", { key }, token.slice(1, -1)));
    } else if (token.startsWith("`")) {
      nodes.push(
        createElement(
          "code",
          {
            key,
            className:
              "rounded bg-surface px-1.5 py-0.5 text-[0.875em] text-foreground",
          },
          token.slice(1, -1),
        ),
      );
    } else {
      const link = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (link) {
        const href = link[2];
        const label = link[1];
        const className =
          "font-medium text-foreground underline decoration-border underline-offset-2 transition-colors hover:text-primary";
        if (href.startsWith("http")) {
          nodes.push(
            createElement(
              "a",
              {
                key,
                href,
                className,
                target: "_blank",
                rel: "noopener noreferrer",
              },
              label,
            ),
          );
        } else {
          nodes.push(
            createElement(Link, { key, href, className }, label),
          );
        }
      }
    }
    last = match.index + token.length;
  }

  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

function parseBlocks(markdown: string): Token[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const tokens: Token[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i += 1;
      continue;
    }

    if (/^---+$/.test(line.trim())) {
      tokens.push({ type: "hr" });
      i += 1;
      continue;
    }

    const heading = line.match(/^(#{2,4})\s+(.+)$/);
    if (heading) {
      tokens.push({
        type: "heading",
        level: heading[1].length as 2 | 3 | 4,
        text: heading[2].trim(),
      });
      i += 1;
      continue;
    }

    if (line.startsWith("> ")) {
      const parts: string[] = [];
      while (i < lines.length && lines[i].startsWith("> ")) {
        parts.push(lines[i].slice(2));
        i += 1;
      }
      const text = parts.join(" ").trim();
      if (text.toLowerCase().startsWith("note:")) {
        tokens.push({ type: "callout", text: text.slice(5).trim() });
      } else {
        tokens.push({ type: "blockquote", text });
      }
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*]\s+/, "").trim());
        i += 1;
      }
      tokens.push({ type: "ul", items });
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, "").trim());
        i += 1;
      }
      tokens.push({ type: "ol", items });
      continue;
    }

    if (line.includes("|") && i + 1 < lines.length && /^\|?\s*-+/.test(lines[i + 1])) {
      const splitRow = (row: string) =>
        row
          .replace(/^\|/, "")
          .replace(/\|$/, "")
          .split("|")
          .map((cell) => cell.trim());
      const headers = splitRow(line);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].includes("|") && lines[i].trim()) {
        rows.push(splitRow(lines[i]));
        i += 1;
      }
      tokens.push({ type: "table", headers, rows });
      continue;
    }

    const parts: string[] = [line];
    i += 1;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].startsWith("#") &&
      !lines[i].startsWith("> ") &&
      !/^[-*]\s+/.test(lines[i]) &&
      !/^\d+\.\s+/.test(lines[i]) &&
      !/^---+$/.test(lines[i].trim())
    ) {
      parts.push(lines[i]);
      i += 1;
    }
    tokens.push({ type: "paragraph", text: parts.join(" ").trim() });
  }

  return tokens;
}

export function renderBlogMarkdown(markdown: string): ReactNode {
  const tokens = parseBlocks(markdown);
  return createElement(
    Fragment,
    null,
    ...tokens.map((token, index) => {
      const key = `block-${index}`;
      switch (token.type) {
        case "heading": {
          const Tag = `h${token.level}` as "h2" | "h3" | "h4";
          const className =
            token.level === 2
              ? "mt-10 scroll-mt-24 font-display text-[1.5rem] font-semibold leading-[1.2] tracking-[-0.025em] text-foreground first:mt-0 sm:text-[1.65rem]"
              : token.level === 3
                ? "mt-8 scroll-mt-24 text-lg font-semibold tracking-tight text-foreground"
                : "mt-6 scroll-mt-24 text-base font-semibold text-foreground";
          return createElement(
            Tag,
            { key, className },
            inline(token.text, key),
          );
        }
        case "paragraph":
          return createElement(
            "p",
            {
              key,
              className:
                "mt-4 text-[1.025rem] leading-[1.75] text-muted-foreground first:mt-0",
            },
            inline(token.text, key),
          );
        case "blockquote":
          return createElement(
            "blockquote",
            {
              key,
              className:
                "mt-6 border-l-2 border-primary/40 pl-4 text-[1.025rem] leading-relaxed text-muted-foreground italic",
            },
            inline(token.text, key),
          );
        case "callout":
          return createElement(
            "aside",
            {
              key,
              className:
                "mt-6 rounded-xl border border-border bg-surface/80 px-4 py-3 text-sm leading-relaxed text-muted-foreground",
            },
            createElement(
              "p",
              null,
              createElement(
                "span",
                { className: "font-medium text-foreground" },
                "Note: ",
              ),
              inline(token.text, key),
            ),
          );
        case "ul":
          return createElement(
            "ul",
            {
              key,
              className:
                "mt-4 list-disc space-y-2 pl-5 text-[1.025rem] leading-relaxed text-muted-foreground",
            },
            ...token.items.map((item, itemIndex) =>
              createElement(
                "li",
                { key: `${key}-li-${itemIndex}` },
                inline(item, `${key}-${itemIndex}`),
              ),
            ),
          );
        case "ol":
          return createElement(
            "ol",
            {
              key,
              className:
                "mt-4 list-decimal space-y-2 pl-5 text-[1.025rem] leading-relaxed text-muted-foreground",
            },
            ...token.items.map((item, itemIndex) =>
              createElement(
                "li",
                { key: `${key}-li-${itemIndex}` },
                inline(item, `${key}-${itemIndex}`),
              ),
            ),
          );
        case "table":
          return createElement(
            "div",
            {
              key,
              className: "mt-6 overflow-x-auto rounded-xl border border-border",
            },
            createElement(
              "table",
              { className: "w-full min-w-[28rem] border-collapse text-left text-sm" },
              createElement(
                "thead",
                { className: "bg-surface" },
                createElement(
                  "tr",
                  null,
                  ...token.headers.map((header, headerIndex) =>
                    createElement(
                      "th",
                      {
                        key: `${key}-th-${headerIndex}`,
                        className:
                          "border-b border-border px-3 py-2.5 font-semibold text-foreground",
                      },
                      inline(header, `${key}-th-${headerIndex}`),
                    ),
                  ),
                ),
              ),
              createElement(
                "tbody",
                null,
                ...token.rows.map((row, rowIndex) =>
                  createElement(
                    "tr",
                    {
                      key: `${key}-tr-${rowIndex}`,
                      className: "border-b border-border last:border-0",
                    },
                    ...row.map((cell, cellIndex) =>
                      createElement(
                        "td",
                        {
                          key: `${key}-td-${rowIndex}-${cellIndex}`,
                          className: "px-3 py-2.5 text-muted-foreground align-top",
                        },
                        inline(cell, `${key}-td-${rowIndex}-${cellIndex}`),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          );
        case "hr":
          return createElement("hr", {
            key,
            className: "my-10 border-border",
          });
        default:
          return null;
      }
    }),
  );
}
