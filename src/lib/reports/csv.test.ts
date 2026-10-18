import { describe, expect, it } from "vitest";
import { csvCell, toCsv } from "./csv";

describe("csv", () => {
  it("quotes and escapes cells", () => {
    expect(csvCell('He said "great"')).toBe('"He said ""great"""');
    expect(csvCell(null)).toBe('""');
    expect(csvCell(4)).toBe('"4"');
  });
  it("neutralises formula injection from free-text answers", () => {
    expect(csvCell("=HYPERLINK(\"x\")")).toBe("\"'=HYPERLINK(\"\"x\"\")\"");
    expect(csvCell("-2+3")).toBe("\"'-2+3\"");
    expect(csvCell("@cmd")).toBe("\"'@cmd\"");
  });
  it("builds CRLF rows with a BOM", () => {
    expect(toCsv([["a", "b"], [1, 2]])).toBe('﻿"a","b"\r\n"1","2"');
  });
});
