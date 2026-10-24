import { absoluteUrl } from "@/lib/site";

export type ProductVideoConfig = {
  youtubeId: string;
  title: string;
  description: string;
  poster: string;
  durationIso: string;
  durationLabel: string;
  uploadDate: string;
};

export const PRODUCT_VIDEO = {
  youtubeId: "geUpzkJdH1M",
  title: "Meet Appraisal Software",
  description:
    "A 55-second tour of Appraisal Software: start from a ready-made template, set the questions, add people, launch the campaign and track responses in one place.",
  poster: "/marketing/meet-appraisal-software.jpg",
  durationIso: "PT55S",
  durationLabel: "0:55",
  uploadDate: "2026-10-23T03:44:48-07:00",
} as const satisfies ProductVideoConfig;

export const FEEDBACK_360_VIDEO = {
  youtubeId: "hx8VO8TLeU8",
  title: "360 Appraisals | Appraisal Software",
  description:
    "See how a 360 appraisal comes together in Appraisal Software: build the feedback form, choose the subject and reviewers, send invitations and collect anonymous feedback.",
  poster: "/marketing/360-appraisals-video.jpg",
  durationIso: "PT59S",
  durationLabel: "0:59",
  uploadDate: "2026-10-23",
} as const satisfies ProductVideoConfig;

export const EMPLOYEE_APPRAISAL_VIDEO = {
  youtubeId: "WxYA0QkYBMI",
  title: "Employee Appraisals | Appraisal Software",
  description:
    "See how an employee appraisal runs in Appraisal Software: employees complete a focused self-appraisal, managers add their response, and both perspectives stay together for the review conversation.",
  poster: "/marketing/employee-appraisals-video.jpg",
  durationIso: "PT1M4S",
  durationLabel: "1:04",
  uploadDate: "2026-10-23",
} as const satisfies ProductVideoConfig;

export function productVideoSchema(video: ProductVideoConfig = PRODUCT_VIDEO) {
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: video.title,
    description: video.description,
    thumbnailUrl: absoluteUrl(video.poster),
    uploadDate: video.uploadDate,
    duration: video.durationIso,
    embedUrl: `https://www.youtube.com/embed/${video.youtubeId}`,
    contentUrl: `https://www.youtube.com/watch?v=${video.youtubeId}`,
    inLanguage: "en-GB",
  };
}
