export const ROUTES = {
  home: "/",
  annualAppraisalSoftware: "/annual-appraisal-software",
  employeeAppraisalSoftware: "/employee-appraisal-software",
  feedback360Software: "/360-feedback-software",
  annualAppraisalTemplate: "/annual-appraisal-template",
  appraisalQuestions: "/appraisal-questions",
  feedback360Template: "/360-feedback-template",
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];

export const INDEXABLE_PATHS: RoutePath[] = [
  ROUTES.home,
  ROUTES.annualAppraisalSoftware,
  ROUTES.employeeAppraisalSoftware,
  ROUTES.feedback360Software,
  ROUTES.annualAppraisalTemplate,
  ROUTES.appraisalQuestions,
  ROUTES.feedback360Template,
];
