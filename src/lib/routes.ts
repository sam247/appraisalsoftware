export const ROUTES = {
  home: "/",
  annualAppraisalSoftware: "/annual-appraisal-software",
  employeeAppraisalSoftware: "/employee-appraisal-software",
  feedback360Software: "/360-feedback-software",
  annualAppraisalTemplate: "/annual-appraisal-template",
  appraisalQuestions: "/appraisal-questions",
  feedback360Template: "/360-feedback-template",
  templates: "/templates",
  resources: "/resources",
  howItWorks: "/how-it-works",
  annualAppraisalGuide: "/annual-appraisal-guide",
  selfAppraisalTemplate: "/self-appraisal-template",
  appraisalAnswers: "/appraisal-answers",
  appraisalComments: "/appraisal-comments",
  appraisalObjectives: "/appraisal-objectives",
  personalDevelopmentPlanTemplate: "/personal-development-plan-template",
  feedback360Guide: "/360-degree-feedback",
  feedback360Questions: "/360-feedback-questions",
  feedback360Examples: "/360-feedback-examples",
  probationReviewTemplate: "/probation-review-template",
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];

export const INDEXABLE_PATHS: RoutePath[] = Object.values(ROUTES);
