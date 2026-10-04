export const enquiryTypes = {
  pricing: "Pricing and plans",
  product: "Product question",
  support: "Existing-customer support",
  other: "Something else",
} as const;
export type ContactFields = {
  name: string;
  email: string;
  organisation: string;
  type: string;
  message: string;
  plan: string;
};
export type ContactErrors = Partial<Record<keyof ContactFields, string>>;
export function validateContact(value: unknown): {
  fields: ContactFields;
  errors: ContactErrors;
} {
  const input =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};
  const fields = Object.fromEntries(
    ["name", "email", "organisation", "type", "message", "plan"].map((key) => [
      key,
      typeof input[key] === "string" ? input[key].trim() : "",
    ]),
  ) as ContactFields;
  const errors: ContactErrors = {};
  if (!fields.name || fields.name.length > 100 || /[\r\n]/.test(fields.name))
    errors.name = "Enter your name (up to 100 characters).";
  if (
    fields.email.length > 254 ||
    !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(fields.email)
  )
    errors.email = "Enter a valid email address.";
  if (fields.organisation.length > 150 || /[\r\n]/.test(fields.organisation))
    errors.organisation = "Use up to 150 characters for your organisation.";
  if (!Object.hasOwn(enquiryTypes, fields.type))
    errors.type = "Choose an enquiry type.";
  if (!fields.message || fields.message.length > 5000)
    errors.message = "Enter a message (up to 5,000 characters).";
  if (fields.plan && !["Pro", "Organisation"].includes(fields.plan))
    errors.plan = "Choose Pro or Organisation, or leave the plan blank.";
  return { fields, errors };
}
