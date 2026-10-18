import { AGREE } from "../scales";
import { UK, type TemplatePack } from "../types";

/** Financial services packs. Sources: docs/marketplace-sources.md. */
export const financialPacks: TemplatePack[] = [
  {
    slug: "smcr-fitness-propriety-pack",
    name: "SM&CR Fitness & Propriety Review",
    category: "Financial services",
    group: "Financial services",
    summary:
      "A structured fitness and propriety and Conduct Rules review for certified staff, with evidence and a recorded conclusion.",
    benefits: [
      "Honesty, competence and financial soundness in one place",
      "Conduct Rules and customer outcomes reviewed together",
      "Evidence, disclosures and the assessor's reasons recorded",
    ],
    basis:
      "Designed to support periodic fitness and propriety assessments and Conduct Rules reviews under the FCA's Senior Managers and Certification Regime.",
    seoTitle: "SM&CR Fitness and Propriety Assessment Template",
    nations: UK,
    reviewed: "2026-10-18",
    version: 1,
    changelog: [{ version: 1, date: "2026-10-18", summary: "First release." }],
    minutes: 15,
    price: 8900,
    includedWithPro: false,
    campaignType: "annual_appraisal",
    accent: "blue",
    questions: [
      { type: "rating", area: "Honesty and integrity", prompt: "How consistently does this person act with integrity, including when no one is checking?", scale: AGREE },
      { type: "rating", area: "Honesty and integrity", prompt: "How openly are mistakes, breaches and conflicts of interest raised?", scale: AGREE },
      {
        type: "rating",
        area: "Competence and capability",
        prompt: "How well do this person's knowledge and skills match the needs of their certified function?",
        scale: AGREE,
      },
      { type: "rating", area: "Competence and capability", prompt: "How well are relevant qualifications and CPD kept up to date?", scale: AGREE },
      {
        type: "rating",
        area: "Conduct Rules",
        prompt: "How well does day-to-day behaviour reflect the individual Conduct Rules?",
        help: "In summary: integrity; due skill, care and diligence; openness with regulators; treating customers fairly; proper market conduct; and good outcomes for retail customers where relevant.",
        scale: AGREE,
      },
      {
        type: "rating",
        area: "Customer outcomes",
        prompt: "How well does their work support good outcomes for customers, including those in vulnerable circumstances?",
        scale: AGREE,
      },
      { type: "rating", area: "Risk and controls", prompt: "How well are risk controls, procedures and escalation routes followed?", scale: AGREE },
      { type: "rating", area: "Culture and respect", prompt: "How consistently is respect shown to colleagues, free of bullying, harassment or discrimination?", scale: AGREE },
      { type: "rating", area: "Culture and respect", prompt: "How well does this person help create a culture where people feel able to speak up?", scale: AGREE },
      { type: "text", prompt: "Evidence of competence for the certified function this period.", help: "For example training, file reviews, supervision outcomes or quality checks." },
      {
        type: "text",
        prompt: "Have there been any breaches, complaints, disciplinary matters or regulatory issues since the last assessment?",
        help: "Record a short summary and refer to your firm's records.",
      },
      {
        type: "text",
        prompt: "Has anything changed that the firm should consider for fitness and propriety?",
        help: "For example a criminal, regulatory or financial matter. Record yes or no here and keep details and checks in your firm's own fitness and propriety file.",
      },
      { type: "text", prompt: "Development or supervision needed before the next assessment." },
      {
        type: "text",
        prompt: "Assessor's conclusion and reasons.",
        help: "Your firm decides whether to issue or renew a certificate, using its own process and evidence.",
      },
      { type: "text", prompt: "Agreed actions and the date of the next review." },
    ],
  },
];
