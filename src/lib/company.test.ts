import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { COMPANY, companyDisclosure } from "./company";

describe("company details", () => {
  it("disclose the legal name, registration and registered office", () => {
    expect(companyDisclosure()).toBe(
      "Appraisal Software is a trading name of Umbrella Rank Ltd, registered in England and Wales. Registered office: 128 City Road, London, EC1V 2NX.",
    );
    expect(companyDisclosure()).not.toContain("null");
  });

  it("are used by the footer, privacy and cookie pages and admin emails", () => {
    for (const file of ["src/components/home/Footer.tsx", "src/app/privacy/page.tsx", "src/app/cookies/page.tsx", "src/lib/email/admin-invite.ts"])
      expect(readFileSync(file, "utf8"), file).toContain("@/lib/company");
    expect(COMPANY.legalName).toBe("Umbrella Rank Ltd");
  });
});

describe("VAT wording", () => {
  it("never says VAT is added or excluded: no VAT is charged", () => {
    const files: string[] = [];
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const full = path.join(dir, name);
        if (statSync(full).isDirectory()) walk(full);
        else if (/\.(tsx?|md)$/.test(name) && !/\.test\.ts$/.test(name)) files.push(full);
      }
    };
    walk("src");
    walk("content");
    const offenders = files.flatMap((file) =>
      readFileSync(file, "utf8")
        .split("\n")
        // A competitor's own pricing may legitimately exclude VAT.
        .filter((line) => /\+ ?VAT|exclud(e|es|ing) VAT|plus VAT/i.test(line) && !/CharlieHR|recruitment and HR advice add-ons/.test(line))
        .map((line) => `${file}: ${line.trim().slice(0, 80)}`),
    );
    expect(offenders).toEqual([]);
    for (const file of ["src/app/dashboard/marketplace/actions.ts", "src/app/dashboard/upgrade/actions.ts"]) {
      const source = readFileSync(file, "utf8");
      expect(source).toContain("automatic_tax: { enabled: false }");
      expect(source).not.toContain("STRIPE_AUTOMATIC_TAX");
    }
  });
});
