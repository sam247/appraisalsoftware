import { describe, expect, it } from "vitest";
import { employeeCapacity } from "./plan";
describe("workspace employee capacity", () => {
  it("preserves legacy access and paid capacity", () => {
    expect(employeeCapacity("legacy")).toBeNull();
    expect(employeeCapacity("free")).toBe(10);
    expect(employeeCapacity("pro")).toBe(75);
    expect(employeeCapacity("organisation")).toBe(250);
  });
});
