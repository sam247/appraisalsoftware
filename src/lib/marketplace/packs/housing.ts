import { AGREE } from "../scales";
import { ENGLAND, type TemplatePack } from "../types";

/** Social housing packs. Sources: docs/marketplace-sources.md. */
export const housingPacks: TemplatePack[] = [
  {
    slug: "social-housing-competence-pack",
    name: "Social Housing Competence & Conduct Appraisal",
    category: "Social housing",
    group: "Housing",
    summary:
      "An appraisal for housing staff built around tenant focus, respectful conduct, safety and professional qualifications.",
    benefits: [
      "Tenant focus, conduct and complaints handling reviewed",
      "Damp, mould, repairs and safety follow-up covered",
      "Qualification status and target dates tracked",
    ],
    basis:
      "Designed to support the staff appraisal and development processes relevant to the Regulator of Social Housing's Competence and Conduct Standard.",
    seoTitle: "Social Housing Staff Appraisal Template (Competence and Conduct Standard)",
    nations: ENGLAND,
    reviewed: "2026-10-18",
    version: 1,
    changelog: [{ version: 1, date: "2026-10-18", summary: "First release." }],
    minutes: 12,
    price: 8900,
    includedWithPro: false,
    campaignType: "annual_appraisal",
    accent: "jade",
    questions: [
      { type: "rating", area: "Tenant focus", prompt: "How well does this person put tenants' needs and experiences at the centre of their work?", scale: AGREE },
      {
        type: "rating",
        area: "Respect and fairness",
        prompt: "How consistently are tenants treated with fairness, empathy and respect, including those with additional needs?",
        scale: AGREE,
      },
      { type: "rating", area: "Conduct", prompt: "How well does their behaviour reflect your organisation's code of conduct?", scale: AGREE },
      { type: "rating", area: "Regulatory knowledge", prompt: "How well do they understand the consumer standards that apply to their role?", scale: AGREE },
      {
        type: "rating",
        area: "Safety and quality",
        prompt: "How promptly and effectively are safety, damp and mould, and repair issues acted on?",
        help: "Include hazards covered by Awaab's Law where relevant to the role.",
        scale: AGREE,
      },
      { type: "rating", area: "Complaints", prompt: "How well are complaints handled, resolved and learned from?", scale: AGREE },
      { type: "rating", area: "Communication", prompt: "How clearly and accessibly is information shared with tenants?", scale: AGREE },
      { type: "rating", area: "Working with others", prompt: "How well do they work with contractors, colleagues and partner agencies?", scale: AGREE },
      { type: "rating", area: "Professional development", prompt: "How actively is professional knowledge kept up to date?", scale: AGREE },
      { type: "text", prompt: "An example of work that improved a tenant's experience, and what made it work.", help: "Don't include tenants' names or addresses." },
      {
        type: "text",
        prompt: "Qualification status: held, in progress or not started, with the expected completion date.",
        help: "Some senior housing roles need a relevant qualification under the Competence and Conduct Standard. Check whether this role is in scope.",
      },
      { type: "text", prompt: "Any conduct, complaint or performance matters to discuss?", required: false },
      { type: "text", prompt: "Development goals and support needed for the next period." },
      { type: "text", prompt: "Agreed actions and the date of the next review." },
    ],
  },
];
