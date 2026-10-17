import { describe, expect, it, vi } from "vitest";
import { GENERIC_ERROR, friendlyError } from "./errors";

describe("friendlyError", () => {
  it("passes through messages our RPCs raise on purpose", () => {
    expect(friendlyError({ code: "P0001", message: "Your plan allows 1 active campaign" })).toBe(
      "Your plan allows 1 active campaign",
    );
  });

  it("maps duplicates, with an optional specific message", () => {
    const dup = { code: "23505", message: 'duplicate key value violates unique constraint "people_email_key"' };
    expect(friendlyError(dup)).not.toContain("constraint");
    expect(friendlyError(dup, { duplicate: "Already here" })).toBe("Already here");
  });

  it("never leaks unknown database text", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(friendlyError({ code: "XX000", message: "relation foo does not exist" })).toBe(GENERIC_ERROR);
    expect(friendlyError(null)).toBe(GENERIC_ERROR);
    spy.mockRestore();
  });
});
