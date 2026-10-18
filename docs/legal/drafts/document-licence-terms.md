# DRAFT: Downloadable template terms (Word + PDF)

> **Status: DRAFT. NOT APPROVED. NOT FOR PUBLICATION.**
> Prepared 18 October 2026 for founder and legal review before downloads launch. Nothing here is live, and no checkout uses it.
> Words in [square brackets] are choices to confirm. Statutory references were checked against legislation.gov.uk on 18 October 2026 (see "Sources"). This is drafting support, not legal advice: a solicitor should review it before launch.

Seller: **Umbrella Rank Ltd**, trading as Appraisal Software. [Add company number and registered office.] Umbrella Rank Ltd does not charge VAT on these purchases (founder decision, 18 October 2026).

---

## 1. Licence for organisational use

1.1 **What you buy.** Each purchase gives you a licence to one template pack (the "Template"). It covers an editable Microsoft Word document and a printable PDF for the pack named on your order confirmation, at the version supplied and any updates we provide under section 2.

1.2 **Who may use it.** The licence is granted to the organisation named in, or evident from, the purchase (or to you, if you buy for yourself). It may be used by that organisation's employees, workers, volunteers and contractors, but only for that organisation's own appraisals, supervision and development. [Confirm: one legal entity, or a group of companies under common control?]

1.3 **What you may do.** Within your organisation you may:
- use the Template as often as you like, for as many people as you like;
- copy, print and store it;
- edit, adapt, translate and add to it, including removing or rewording questions;
- keep completed forms as part of your records.

1.4 **What you may not do.** You may not:
- sell, sublicense, lend, rent or give the Template, or anything substantially based on it, to anyone outside your organisation;
- publish it, including on a website, template library, marketplace or shared drive open to the public;
- offer it, or a substantially similar version, as part of a product or service to other organisations, for example as an HR consultant or software provider;
- remove the version and copyright notice from unedited copies.

Completed forms you create for your own staff are yours, and these limits do not apply to them.

1.5 **Ownership.** We, or our licensors, keep all intellectual property rights in the Template. The licence is non-exclusive and non-transferable, except to a successor that takes over your organisation's relevant business.

1.6 **Regulatory position.** The Template is designed to support appraisal and supervision processes. It is not legal or regulatory advice and does not replace your own obligations. Using or completing it does not by itself demonstrate compliance with any law, regulator or inspection framework, including CQC, Ofsted, the Children's Homes (England) Regulations 2015 or the EYFS statutory framework. The Template is written for England. Check whether it suits your setting and keep your own records.

1.7 **Ending the licence.** If you materially breach section 1.4 and don't put it right within 14 days of us asking, we may end the licence. If we refund your purchase in full, the licence also ends. In either case you must stop using unedited copies. You may keep completed forms.

1.8 **Interactive templates are separate.** Buying a downloadable Template does not give you access to Appraisal Software, or to the interactive version of the pack, and buying one doesn't give you the other.

## 2. Updates at no extra cost

2.1 We may update a Template, for example to reflect a change in regulation or guidance, fix an error or improve the wording. When we publish a new version, you can download it from your access link at no extra cost: updates are included in the price you paid.

2.2 **How long.** Updates are available for [as long as we offer the Template for sale, and in any case for at least 12 months from your purchase]. If we stop offering a Template, we will tell you by email, and you can download the latest version for at least [90 days] afterwards.

2.3 Updates are offered, not imposed. Your existing copies and completed forms are never changed, and you choose whether to start using a new version.

2.4 We don't promise to update a Template by a particular date, or whenever a law or guidance changes. Each version shows its version number and the date it was last reviewed. Check that date before relying on the content.

2.5 Updates don't change your statutory rights. Each version we supply must still be as described, of satisfactory quality and fit for purpose (section 3.4).

## 3. Cancellation and refunds

### Consumers (buying wholly or mainly outside your trade, business, craft or profession)

3.1 **Your right to cancel.** By law you normally have 14 days from the day you buy to cancel a purchase of digital content.

3.2 **Losing the right to cancel.** Because the Template is downloadable digital content, we can make it available immediately only if, before downloading, you:
- (a) expressly ask us to supply it now; and
- (b) acknowledge that you will lose your right to cancel once the download begins.

We ask for both at checkout (section 4). Because the Template is supplied by instant download, giving them is a condition of buying. [Option B instead: make the checkbox optional, and if it isn't ticked, keep the right to cancel for 14 days and release the files only after that period, or once consent is given.] Once you have given them and the download starts, you can no longer cancel.

3.3 [**Goodwill refund (optional, recommended):** if you haven't downloaded any file, you can ask for a full refund within 14 days of purchase, even if you gave consent at checkout.]

3.4 **If something is wrong.** Your statutory rights are not affected. The Template must be as described, of satisfactory quality and fit for purpose. If it isn't, contact us and we will:
- repair or replace it; or
- if we can't do that within a reasonable time and without significant inconvenience to you, give you an appropriate price reduction, up to a full refund.

If faulty digital content we supplied damages your device or other digital content because we didn't take reasonable care, we will repair the damage or compensate you.

3.5 **How to cancel or ask for a refund.** Email [support@appraisalsoftware.co.uk] with your order reference. If you are cancelling within your 14-day right to cancel, we will refund you within 14 days of you telling us. Other refunds are made within 14 days of us agreeing to them. Refunds go to your original payment method.

### Business buyers

3.6 Statutory consumer cancellation rights don't apply to purchases made for business purposes. We will still replace or refund a Template that is materially not as described, if you tell us within [30 days] of purchase. [Optional: we also offer the goodwill refund in 3.3 to business buyers.]

3.7 Our total liability to a business buyer for a Template is limited to the price paid. Nothing here limits liability that can't legally be limited, such as for death or personal injury caused by negligence, or for fraud. [Solicitor to confirm reasonableness under the Unfair Contract Terms Act 1977.]

### Everyone

3.8 If a payment is refunded or reversed, including through a chargeback, the licence ends (1.7) and your access link stops working.

3.9 [Duplicate purchases: if you buy the same Template twice by mistake, tell us and we'll refund the second purchase.]

## 4. Checkout wording (consent to immediate supply)

Shown on the Stripe Checkout page as a **required, unticked** checkbox, separate from accepting the terms:

> ☐ I want to download my template straight away. I understand that once the download starts I will lose my 14-day right to cancel. (Consumers only; this doesn't affect your rights if the template is faulty.)

Shown under the button:

> By paying you agree to our [Template Licence and Terms]. Price £[24.99], one-off payment. No VAT is charged. UK billing addresses only.

**Implementation notes, not customer-facing:**
- Record the time the box was ticked (`cancellation_waiver_at`).
- Release files only after payment is confirmed and the box was ticked.
- If the box can't be captured, don't release files until 14 days have passed.
- Show £24.99 as the total price, with no fees added later.

## 5. Order confirmation email (durable-medium confirmation)

> **Subject:** Your Appraisal Software template: order [AS-D-XXXX-XXXX-XXXX]
>
> Thanks for your order.
>
> **Order reference:** AS-D-XXXX-XXXX-XXXX
> **Template:** [Care Worker Appraisal & Supervision (CQC)], version [v1.1], Word (.docx) and PDF
> **Price paid:** £[24.99] (no VAT charged)
> **Seller:** Umbrella Rank Ltd, [registered office], [company number]
>
> **Download your files:** [secure link, valid for [12 months]; request a new link any time at appraisalsoftware.co.uk/downloads]
>
> **Your consent:** at checkout you asked us to supply the template immediately and acknowledged that you would lose your 14-day right to cancel once the download began. If you're a consumer and haven't downloaded yet, [you can still ask for a refund within 14 days of purchase (goodwill policy)].
>
> **Your licence:** use, copy and adapt the template within your organisation. Don't share or resell it outside your organisation. Full terms: [link to the version of the terms in force at purchase].
>
> **Updates:** new versions are included at no extra cost and appear at the same link. [Duration as in 2.2.]
>
> This template is designed to support your appraisal and supervision processes. It is not a substitute for your organisation's regulatory obligations or legal advice. Buying or completing it does not by itself demonstrate compliance.
>
> Questions or a problem with your files? Reply to this email or contact [support@appraisalsoftware.co.uk], quoting your order reference.

Attach or link the full terms as a PDF, so the buyer has them on a durable medium.

## 6. Product page summary (when downloads launch)

> **Editable Word + printable PDF: £[24.99]. No VAT charged.**
> One-off purchase. Use it across your organisation, with updates included [while we offer this template]. UK buyers only. Instant download: by downloading straight away, consumers give up the 14-day right to cancel. [Goodwill refund if not downloaded.] [Licence and terms]

## 7. Information to show before purchase (consumers)

Under the Consumer Contracts Regulations 2013 (reg 13 and Schedule 2), the product page or checkout must show the following before the buyer pays:

- **Main characteristics:** what's in the pack, both formats, number of questions, that it's written for England, and the regulatory disclaimer.
- **Seller identity:** Umbrella Rank Ltd, registered office address, company number, and contact email (and phone, if offered).
- **Price:** £[24.99] total, no VAT charged, no extra fees. One-off; it is not a subscription.
- **Payment and delivery:** payment by card through Stripe; delivery by immediate download link and email.
- **Functionality and compatibility:** an editable .docx that opens in Microsoft Word 2016 or later, LibreOffice or Google Docs (check before launch), and a PDF for any PDF reader. No DRM, no account needed.
- **Right to cancel:** the 14-day right, and that it is lost once the buyer consents to immediate download and the download starts (Schedule 2 (l)).
- **Legal guarantee:** a reminder that statutory rights for digital content apply.
- **Complaints:** how to complain, and the response time we commit to.
- **Order button:** labelled with words that make clear the buyer must pay, e.g. "Pay £24.99" (reg 14(3)). Stripe's default "Pay" meets this.

## Review checklist

- [ ] Company details and contact email.
- [x] VAT position: no VAT charged (founder, 18 October 2026). Price wording: "No VAT charged". Revisit if the company registers for VAT.
- [ ] Licence scope: single entity or group (1.2); consultant and reseller restriction wording (1.4).
- [ ] Update period (2.2) and wind-down period after a template is withdrawn.
- [ ] Goodwill refund (3.3, 3.6) on or off.
- [ ] Business liability cap (3.7) reviewed for reasonableness.
- [ ] Checkout consent captured as a separate, unticked, required checkbox, with the time recorded.
- [ ] Confirmation email sent within a reasonable time, including the consent confirmation and the terms.
- [ ] Privacy notice updated: purchase email, Stripe, download records, retention.
- [ ] Company number and registered office shown on the website (required on company websites, and not shown today), on order emails and in the terms.
- [ ] Checkout consent: option A (required) or option B (optional, release after 14 days). The draft uses A.
- [ ] Section 7 information present on the product page or checkout before launch; file compatibility claims tested.
- [ ] Solicitor sign-off.

## Sources (checked 18 October 2026)

| Topic | Reference | Note |
|---|---|---|
| 14-day cancellation | [Consumer Contracts (Information, Cancellation and Additional Charges) Regulations 2013, reg 29(1) and reg 30(2)](https://www.legislation.gov.uk/uksi/2013/3134/regulation/30) | The period runs from the day the contract is made. |
| Losing the right for digital content | [CCRs reg 37](https://www.legislation.gov.uk/uksi/2013/3134/regulation/37) | Needs express consent *and* acknowledgement before supply begins. If either is missing (or the confirmation), the consumer bears no cost (reg 37(4)). |
| Confirmation on a durable medium | [CCRs reg 16](https://www.legislation.gov.uk/uksi/2013/3134/regulation/16) | Must confirm the consent and acknowledgement (reg 16(3)) within a reasonable time. |
| DMCC Act 2024 changes to the CCRs | [s.279](https://www.legislation.gov.uk/ukpga/2024/13/section/279) | Prospective, and about subscriptions only; doesn't affect regs 16, 29, 30 or 37. |
| Digital content quality and remedies | [Consumer Rights Act 2015, ss.34–36, 42–47](https://www.legislation.gov.uk/ukpga/2015/15/part/1/chapter/3) | Rights can't be excluded (s.47). Device damage is covered by s.46. |
| Updates | [CRA s.40](https://www.legislation.gov.uk/ukpga/2015/15/section/40) | No statutory duty to update. A promise of updates is a term, so state its scope and duration. |
| Price display | [DMCC Act 2024 s.230](https://www.legislation.gov.uk/ukpga/2024/13/section/230) (in force 6 April 2025) | The total price, including taxes, is material information for consumers. |
| Consumer definition | [CCRs reg 4](https://www.legislation.gov.uk/uksi/2013/3134/regulation/4) | A sole trader buying for their business is not a consumer. |
| VAT on templates | [HMRC VAT Notice 701/10](https://www.gov.uk/guidance/zero-rating-books-and-printed-matter-for-vat-notice-70110) | Forms and items mainly for completion are standard-rated; templates are very likely 20%. Confirm with an adviser. |
| VAT registration | [GOV.UK: when to register](https://www.gov.uk/vat-registration/when-to-register), [charging VAT](https://www.gov.uk/charge-reclaim-record-vat) | Threshold £90,000. You can't charge VAT unless registered. |
