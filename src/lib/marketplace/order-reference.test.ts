import { describe, expect, it } from "vitest";
import { newOrderReference, normaliseOrderReference } from "./order-reference";

describe("order references", () => {
  it("are readable, unambiguous and effectively unique", () => {
    const refs = new Set(Array.from({ length: 20000 }, newOrderReference));
    expect(refs.size).toBe(20000);
    for (const ref of [...refs].slice(0, 500)) {
      expect(ref).toMatch(/^AS-D-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$/);
      expect(normaliseOrderReference(ref)).toBe(ref);
    }
  });

  it("normalise what a buyer types, and reject anything else", () => {
    expect(normaliseOrderReference(" as d 7kq2 m9xh 3tpw ")).toBe("AS-D-7KQ2-M9XH-3TPW");
    expect(normaliseOrderReference("as-d-7kq2-m9xh-3tpw")).toBe("AS-D-7KQ2-M9XH-3TPW");
    expect(normaliseOrderReference("AS-D-7KQ2-M9XH-3TPO")).toBe("AS-D-7KQ2-M9XH-3TP0");
    expect(normaliseOrderReference("AS-D-7KQ2-M9XH")).toBeNull();
    expect(normaliseOrderReference("'; drop table--")).toBeNull();
  });
});
