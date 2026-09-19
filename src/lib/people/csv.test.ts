import { describe, expect, it } from "vitest";
import { parsePeopleCsv } from "./csv";

describe("parsePeopleCsv", () => {
  it("parses standard headers and skips bad rows", () => {
    const { rows, errors } = parsePeopleCsv(
      [
        "email,full_name,job_title",
        "ada@example.com,Ada Lovelace,Engineer",
        "not-an-email,Bad,Role",
        "ada@example.com,Dup,Role",
        "grace@example.com,,",
      ].join("\n"),
    );
    expect(rows).toEqual([
      {
        email: "ada@example.com",
        full_name: "Ada Lovelace",
        job_title: "Engineer",
        department: null,
        line: 2,
      },
      {
        email: "grace@example.com",
        full_name: null,
        job_title: null,
        department: null,
        line: 5,
      },
    ]);
    expect(errors.some((e) => e.includes("invalid email"))).toBe(true);
    expect(errors.some((e) => e.includes("duplicate"))).toBe(true);
  });

  it("parses optional department column", () => {
    const { rows, errors } = parsePeopleCsv(
      [
        "email,full_name,job_title,department",
        "amy@example.com,Amy Morris,Procurement Manager,Procurement",
        "bob@example.com,Bob,,",
      ].join("\n"),
    );
    expect(errors).toEqual([]);
    expect(rows).toEqual([
      {
        email: "amy@example.com",
        full_name: "Amy Morris",
        job_title: "Procurement Manager",
        department: "Procurement",
        line: 2,
      },
      {
        email: "bob@example.com",
        full_name: "Bob",
        job_title: null,
        department: null,
        line: 3,
      },
    ]);
  });

  it("requires an email column", () => {
    const { rows, errors } = parsePeopleCsv("name,title\nAda,Eng");
    expect(rows).toEqual([]);
    expect(errors[0]).toMatch(/email column/i);
  });
});
