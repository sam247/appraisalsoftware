# Compliance check: downloadable appraisal templates

> Prepared 18 October 2026 with the Legal plugin's compliance-check workflow, as **pre-launch review**. This is not legal advice. Statutory references were checked on legislation.gov.uk and gov.uk the same day. A qualified solicitor (and, for VAT, an accountant) should confirm before launch. Purchases are not live.

**Initiative.** Umbrella Rank Ltd, trading as Appraisal Software, will sell Word + PDF appraisal templates. Details:
- £24.99 each, no VAT charged, UK billing addresses only.
- Guest Stripe Checkout; delivery by emailed access link and short-lived signed URLs.
- Updates included at no extra cost.
- Three England-only packs: CQC care worker, EYFS supervision, children's home.
- Buyers are mostly organisations, but consumers and sole traders can buy.

## Summary

**Proceed with conditions.** The design already has the important protections:
- separate licences, so a download never grants the software;
- no buyer data in the files;
- hashed access tokens and short-lived signed URLs;
- UK-only sales;
- disclaimers on every surface;
- purchases blocked in code.

Six conditions must be met before activation:
1. Consistent cancellation-consent wording. Fixed in the draft; option A or B still to choose.
2. The full consumer pre-contract information on the page or at checkout.
3. Trading disclosures on the website.
4. An updated privacy notice.
5. A "no VAT" position consistent across the whole site.
6. A solicitor's review of the licence, liability and refund terms.

## Applicable regulations and policies

| Regulation | Relevance | Key requirements |
|---|---|---|
| Consumer Contracts (Information, Cancellation and Additional Charges) Regulations 2013, regs 13–16, 29–30, 34, 37 and Sch 2 | Distance sale of digital content to consumers | Pre-contract information (Sch 2). Order button wording (reg 14(3)). Confirmation on a durable medium, including the consent (reg 16). 14-day cancellation (regs 29–30), lost only with express consent *and* acknowledgement before supply starts (reg 37); without them the consumer "bears no cost" (reg 37(4)). Refund within 14 days of cancellation (reg 34). |
| Consumer Rights Act 2015, Part 1 Ch 3 (ss.34–47) | Quality of the digital content | Must be satisfactory, fit for purpose and as described, including updates (s.40). Remedies: repair or replacement, then price reduction or refund. Device damage (s.46). Rights can't be excluded (s.47). |
| Consumer Rights Act 2015, Part 2 | Fairness of consumer terms | The licence termination (1.7) and the scope of updates (2.2) must be transparent and fair. |
| Unfair Contract Terms Act 1977 | Business buyers | The liability cap (3.7) must be reasonable. |
| DMCC Act 2024, Part 4 Ch 1 (in force 6 Apr 2025) | Marketing and pricing to consumers | The total price, including taxes and fees, is material information (s.230). Avoid misleading "free" claims (Sch 20); hence "updates included at no extra cost". Regulatory claims must not mislead: no "CQC-approved" or "compliant". |
| Electronic Commerce (EC Directive) Regulations 2002, regs 6, 9, 11 | Online selling | Trader identity and contact details. Clear steps to conclude the contract. Acknowledge the order without undue delay. |
| Company, LLP and Business (Names and Trading Disclosures) Regulations 2015 | Company website and emails | Registered name, number and office on the website and on business emails. |
| UK GDPR and Data Protection Act 2018 | Buyer email, Stripe data, download records | Lawful basis is the contract. Privacy notice covering purchases, Stripe (an independent controller for payments) and retention (6 years for financial records). Minimisation: no IP or user-agent logging, as designed. Security of access links. |
| PECR 2003, reg 22 | Any marketing emails to buyers | Order and update emails are service messages. Marketing needs consent, or the soft opt-in with an opt-out at purchase. |
| VAT Act 1994 and HMRC guidance | No VAT charged | Allowed only if not VAT-registered. Monitor the £90,000 threshold. If the company registers, the pricing and terms change. |
| Equality Act 2010, s.29 | Service provision | Reasonable adjustments: accessible files (tagged PDF and Word headings are done) and an alternative format on request. |
| Copyright, Designs and Patents Act 1988 | Content ownership | Questions are written in our own words. Statutory frameworks are referenced by name, not copied. No regulator logos. |

## Requirements

| # | Requirement | Status | Action needed |
|---|---|---|---|
| 1 | Reg 37 consent and acknowledgement captured before download, recorded | Designed (draft §4, `cancellation_waiver_at`) | Choose option A (required checkbox) or B (optional, release after 14 days). The draft is now consistent with A. |
| 2 | Reg 16 confirmation on a durable medium, repeating the consent | Drafted (§5) | Send within minutes of payment. Attach the terms as PDF. |
| 3 | Sch 2 pre-contract information | **Not met**: listed in draft §7, not yet built | Add to the product page and checkout before launch, including file compatibility. |
| 4 | Order button names the obligation to pay | Met by Stripe ("Pay £24.99") | Keep the default wording. |
| 5 | Total price shown, with no VAT confusion | Met site-wide ("No VAT charged"; Stripe automatic tax off in code) | — |
| 6 | Trading disclosures (company number, registered office) on the site | Partly met: name, "registered in England and Wales" and the registered office are in the footer, legal pages and admin emails | Add the company number to `src/lib/company.ts`. |
| 7 | CRA statutory rights preserved | Met in the draft (§3.4, §2.5) | Solicitor to confirm wording. |
| 8 | Statutory refund timing (reg 34) | Fixed in the draft (§3.5) | — |
| 9 | Updates promise clear in scope and duration (CRA s.40, Sch 20) | Drafted with brackets (§2.2) | Choose the duration and wind-down period. |
| 10 | Privacy notice covers download purchases | Met (rebuilt 18 October 2026, downloads described as not yet available) | Confirm the retention periods match practice; refresh when downloads launch. |
| 11 | Marketing consent kept separate from order emails | Not designed | Add an unticked marketing opt-in at checkout, or none. |
| 12 | Business liability cap reasonable (UCTA) | Drafted (§3.7) | Solicitor review. |
| 13 | Regulatory disclaimer and no compliance claims | Met (enforced by tests; on files, pages and emails) | Keep the banned-claims test in place. |
| 14 | UK-only sales enforced | Designed (GB billing restriction, `billing_country = 'GB'`) | Enforce in Checkout when built. |
| 15 | Accessible documents | Met (tagged PDF, Word headings) | Run PAC/Acrobat checks before launch; offer alternative formats on request. |

## Risk areas

| Risk | Severity | Mitigation |
|---|---|---|
| Consumers keep a 14-day cancellation right (and pay nothing) if the consent or confirmation is defective (reg 37(4)) | High | One clear checkbox, timestamped; confirmation email with the consent line; files released only after both. Covered in an end-to-end test when built. |
| Implying regulatory compliance in a sector regulated by CQC or Ofsted (misleading practice, reputational) | High | "Designed to support…" wording, the disclaimer everywhere, and a banned-claims test. Review the wording each time a pack is updated. |
| Missing trading disclosures across the existing site | Low | Registered office added; add the company number. |
| "+ VAT" shown while no VAT is charged (inaccurate price information) | Resolved | Copy, structured data and Stripe settings aligned. |
| Redistribution of files (each copy identical, no buyer marking) | Medium | Licence §1.4; order references kept off files by design. Enforce by takedown requests if copies appear online. Accepted trade-off for privacy. |
| Access link forwarded or leaked | Low–Medium | Hashed tokens, expiry, signed URLs (5 min), daily download limit, revocation on refund. |
| Content drifts from framework updates (CQC's new framework, EYFS revisions) | Medium | `reviewed` dates on every file; the sources register; updates included; review each pack when frameworks change. |
| Unreasonable business liability cap | Low | Solicitor review; keep the carve-outs. |
| VAT threshold crossed without noticing | Low (for now) | Monthly turnover check; switch the wording and Stripe settings on registration. |

## Recommended actions

1. **Before launch:** add the Sch 2 pre-contract information, with tested compatibility claims, and the trading disclosures to the product page and checkout. Then build the consent capture and confirmation email exactly as drafted (§4–5).
2. Choose checkout consent option A or B, the update duration (§2.2) and the goodwill refund (§3.3). Then send the drafts to a solicitor.
3. Update the privacy notice for download purchases, and decide on marketing consent.
4. Open a separate PR to replace "+ VAT" with "No VAT charged" on interactive packs and subscriptions. Add the company number and registered office to the site footer at the same time.

## Approvals needed

| Approver | Why | Status |
|---|---|---|
| Founder | Options in the terms (consent A or B, update duration, goodwill refund, licence scope); site-wide VAT wording | Pending |
| Solicitor (UK consumer and commercial) | Licence, refund and cancellation terms; liability cap; regulatory positioning | Pending |
| Accountant | Confirm the no-VAT position and threshold monitoring | Pending |
| Data protection lead | Privacy notice update; retention periods | Pending |

## Further review recommended

- **Solicitor:** the full terms, especially reg 37 implementation, CRA Part 2 fairness of the termination and update clauses, and UCTA reasonableness of the business cap.
- **Sector wording check:** someone familiar with CQC and Ofsted inspection practice should read the three packs' "basis" lines and help text, to confirm none could be read as a compliance claim.
- **Accessibility audit** of one generated PDF and Word file before launch.
