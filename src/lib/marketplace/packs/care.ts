import { AGREE } from "../scales";
import { ENGLAND, type TemplatePack } from "../types";

/** Health and social care packs. Sources: docs/marketplace-sources.md. */
export const carePacks: TemplatePack[] = [
  {
    slug: "care-worker-appraisal-pack",
    name: "Care Worker Appraisal & Supervision (CQC)",
    category: "Adult social care",
    group: "Health & social care",
    summary:
      "Supervision and annual appraisal for care home and home care staff, covering safe, person-centred practice and learning.",
    benefits: [
      "Safeguarding, consent, medicines and records in one review",
      "Works for regular supervision and the annual appraisal",
      "Care Certificate and qualification progress captured",
    ],
    basis: "Designed to support staff supervision and appraisal processes relevant to CQC Regulation 18 (Staffing).",
    seoTitle: "Care Worker Appraisal and Supervision Template (CQC Regulation 18)",
    nations: ENGLAND,
    reviewed: "2026-10-18",
    version: 1,
    changelog: [{ version: 1, date: "2026-10-18", summary: "First release." }],
    minutes: 15,
    price: 5900,
    includedWithPro: false,
    campaignType: "annual_appraisal",
    accent: "teal",
    questions: [
      { type: "rating", area: "Person-centred care", prompt: "How well is care delivered around each person's needs, preferences and routines?", scale: AGREE },
      { type: "rating", area: "Person-centred care", prompt: "How well are people supported to stay as independent as they want to be?", scale: AGREE },
      { type: "rating", area: "Dignity and respect", prompt: "How consistently are privacy, dignity and respect shown in everyday care?", scale: AGREE },
      { type: "rating", area: "Safeguarding", prompt: "How confidently are signs of abuse or neglect recognised and reported through the right route?", scale: AGREE },
      {
        type: "rating",
        area: "Consent and capacity",
        prompt: "How well is consent sought, and are people supported to make their own decisions?",
        help: "Think about the Mental Capacity Act and the person's care plan.",
        scale: AGREE,
      },
      {
        type: "rating",
        area: "Medicines",
        prompt: "Where medicines support is part of the role, how safely and accurately is it given and recorded?",
        help: "Leave unanswered if medicines are not part of this role.",
        required: false,
        scale: AGREE,
      },
      { type: "rating", area: "Safe practice", prompt: "How consistently are infection prevention and control practices followed?", scale: AGREE },
      { type: "rating", area: "Safe practice", prompt: "How safely are moving and handling plans and risk assessments followed?", scale: AGREE },
      { type: "rating", area: "Records", prompt: "How accurate, timely and respectful are care notes and handovers?", scale: AGREE },
      { type: "rating", area: "Communication", prompt: "How well does communication with people, families and other professionals work?", scale: AGREE },
      { type: "rating", area: "Teamwork", prompt: "How reliably are shifts, cover and support for colleagues handled?", scale: AGREE },
      { type: "rating", area: "Learning", prompt: "How actively has training been completed and put into practice?", scale: AGREE },
      {
        type: "text",
        prompt: "For home care: how is lone working going, and is anything making visits unsafe or rushed?",
        required: false,
      },
      { type: "text", prompt: "Describe a recent time you made a real difference to someone's day.", help: "Use initials, not full names." },
      {
        type: "text",
        prompt: "What has been difficult or worrying in your work since the last review?",
        help: "Supervision is a confidential space to raise this. Avoid other people's personal details.",
        required: false,
      },
      {
        type: "text",
        prompt: "Training completed since the last review, and how it has been used.",
        help: "Include Care Certificate standards, the Level 2 Adult Social Care Certificate or other qualifications in progress.",
      },
      {
        type: "text",
        prompt: "Is there anything about safeguarding, practice or safety you want to raise?",
        help: "Report urgent concerns straight away through your safeguarding procedure. Don't wait for a review.",
        required: false,
      },
      { type: "text", prompt: "Learning and development goals for the next period." },
      { type: "text", prompt: "Agreed actions, who owns them, and the date of the next supervision." },
    ],
  },
];
