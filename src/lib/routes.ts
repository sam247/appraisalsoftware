export const ROUTES = {
  home: "/",
  pricing: "/pricing",
  contact: "/contact",
  employeeAppraisalSoftware: "/employee-appraisal-software",
  feedback360Software: "/360-appraisals",
  annualAppraisalTemplate: "/annual-appraisal-template",
  feedback360Template: "/360-feedback-template",
  templates: "/templates",
  marketplace: "/marketplace",
  resources: "/resources",
  blog: "/blog",
  howItWorks: "/how-it-works",
  annualAppraisalGuide: "/annual-appraisal-guide",
  selfAppraisalTemplate: "/self-appraisal-template",
  appraisalAnswers: "/appraisal-answers",
  appraisalObjectives: "/appraisal-objectives",
  personalDevelopmentPlanTemplate: "/personal-development-plan-template",
  probationReviewTemplate: "/probation-review-template",
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];

export const INDEXABLE_PATHS: RoutePath[] = Object.values(ROUTES);

/** Public legal information, kept outside the SEO landing-page inventory. */
export const LEGAL_ROUTES = { privacy: "/privacy", cookies: "/cookies" } as const;
