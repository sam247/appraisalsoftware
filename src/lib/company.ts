/**
 * The legal entity behind Appraisal Software. One source for the footer,
 * legal pages and emails (trading disclosures).
 */
export const COMPANY = {
  legalName: "Umbrella Rank Ltd",
  tradingName: "Appraisal Software",
  registeredIn: "England and Wales",
  registeredOffice: ["128 City Road", "London", "EC1V 2NX"],
  /** Companies House number; shown wherever set. */
  companyNumber: null as string | null,
  privacyEmail: "privacy@appraisalsoftware.co.uk",
} as const;

export const REGISTERED_OFFICE = COMPANY.registeredOffice.join(", ");

/** e.g. "Appraisal Software is a trading name of Umbrella Rank Ltd, registered in England and Wales. Registered office: …" */
export function companyDisclosure(): string {
  const number = COMPANY.companyNumber ? ` (company number ${COMPANY.companyNumber})` : "";
  return `${COMPANY.tradingName} is a trading name of ${COMPANY.legalName}, registered in ${COMPANY.registeredIn}${number}. Registered office: ${REGISTERED_OFFICE}.`;
}
