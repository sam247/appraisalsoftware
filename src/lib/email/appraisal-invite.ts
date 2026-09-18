import { respondentUrl } from "@/lib/app-origin";

export type AppraisalEmailPayload = {
  campaign_name?: string;
  campaign_type?: string;
  relationship?: string | null;
  raw_token?: string;
  org_name?: string | null;
  respondent_name?: string | null;
  subject_name?: string | null;
  closes_at?: string | null;
  timezone?: string;
  is_reminder?: boolean;
};

const JADE = "#29a46c";
const INK = "#171714";
const MUTED = "#6b635a";
const SURFACE = "#f7f5f1";
const BORDER = "#e8e4dc";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatClosesAt(
  iso: string | null | undefined,
  timezone = "Europe/London",
): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return null;
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: timezone,
  });
}

function relationshipCopy(
  relationship: string | null | undefined,
  subjectName: string | null | undefined,
): {
  title: string;
  body: string;
  cta: string;
} {
  const subject = subjectName?.trim() || "a colleague";
  if (relationship === "self") {
    return {
      title: "Complete your self-appraisal",
      body: `You've been asked to complete a self-appraisal as part of this cycle. Take a few quiet minutes to reflect on your work.`,
      cta: "Start self-appraisal",
    };
  }
  if (relationship === "manager") {
    return {
      title: `Manager appraisal for ${subject}`,
      body: `You've been asked to complete a manager appraisal for ${subject}. Your perspective helps create a balanced review.`,
      cta: "Complete manager appraisal",
    };
  }
  return {
    title: "Complete your appraisal",
    body: "You've been asked to complete an appraisal form. Please follow the link below when you're ready.",
    cta: "Open appraisal",
  };
}

export function buildAppraisalInviteSubject(
  payload: AppraisalEmailPayload,
): string {
  if (payload.campaign_type === "feedback_360")
    return `${payload.is_reminder ? "Reminder: " : ""}360 feedback for ${payload.subject_name?.trim() || "your colleague"}`;
  const org = payload.org_name?.trim();
  if (payload.is_reminder) {
    if (payload.relationship === "self") {
      return org
        ? `Reminder: your self-appraisal for ${org}`
        : "Reminder: complete your self-appraisal";
    }
    if (payload.relationship === "manager") {
      const subject = payload.subject_name?.trim() || "a team member";
      return `Reminder: manager appraisal for ${subject}`;
    }
    return "Reminder: appraisal still open";
  }
  if (payload.relationship === "self") {
    return org
      ? `Your self-appraisal for ${org}`
      : "Your self-appraisal is ready";
  }
  if (payload.relationship === "manager") {
    const subject = payload.subject_name?.trim() || "a team member";
    return `Manager appraisal: ${subject}`;
  }
  return payload.campaign_name?.trim()
    ? `Appraisal: ${payload.campaign_name.trim()}`
    : "You have an appraisal to complete";
}

export function buildAppraisalInviteHtml(payload: AppraisalEmailPayload): {
  html: string;
  text: string;
  respondUrl: string;
} {
  const token = payload.raw_token;
  if (!token) {
    throw new Error("Missing raw_token in outbox payload");
  }

  const respondUrl = respondentUrl(token);
  const orgName = payload.org_name?.trim() || "Your organisation";
  const campaignName = payload.campaign_name?.trim() || "Annual appraisal";
  const anonymous = payload.campaign_type === "feedback_360";
  const privacyCopy = anonymous
    ? "Your organisation receives combined feedback without reviewer names or response times. Results require five reviewers and campaign closure. Written comments may identify their author. Trusted platform operators can access operational records. Keep your personal link private."
    : `Your responses are shared with authorised reviewers in ${orgName}. Only people with your personal link can open this form.`;
  const copy = anonymous
    ? {
        title: `360 feedback for ${payload.subject_name?.trim() || "your colleague"}`,
        body: "You’ve been invited to share feedback about this colleague. Answer based on your experience working together; avoid personal references that identify you.",
        cta: "Give 360 feedback",
      }
    : relationshipCopy(payload.relationship, payload.subject_name);
  const closes = formatClosesAt(payload.closes_at, payload.timezone);
  const greeting = payload.respondent_name?.trim()
    ? `Hi ${escapeHtml(payload.respondent_name.trim())},`
    : "Hello,";
  const reminderNote = payload.is_reminder
    ? `<p style="margin:0 0 16px;color:${MUTED};font-size:14px;line-height:1.5;">This is a friendly reminder — ${anonymous ? "your feedback" : "your appraisal"} is still waiting for your response.</p>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(copy.title)}</title>
</head>
<body style="margin:0;padding:0;background:${SURFACE};font-family:Inter,Segoe UI,Helvetica,Arial,sans-serif;color:${INK};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${SURFACE};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border:1px solid ${BORDER};border-radius:12px;overflow:hidden;">
          <tr>
            <td style="padding:28px 28px 8px;border-bottom:3px solid ${JADE};">
              <p style="margin:0;font-size:22px;letter-spacing:-0.8px;color:${INK};font-weight:700;">appraisal<span style="color:${JADE};">.</span>software</p>
              <p style="margin:8px 0 0;font-size:13px;color:${MUTED};">${escapeHtml(orgName)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <p style="margin:0 0 12px;font-size:15px;line-height:1.5;">${greeting}</p>
              ${reminderNote}
              <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;font-weight:600;color:${INK};">${escapeHtml(copy.title)}</h1>
              <p style="margin:0 0 8px;font-size:15px;line-height:1.55;color:${INK};">${escapeHtml(copy.body)}</p>
              <p style="margin:0 0 20px;font-size:14px;line-height:1.5;color:${MUTED};">Campaign: <strong style="color:${INK};">${escapeHtml(campaignName)}</strong></p>
              ${
                closes
                  ? `<p style="margin:0 0 24px;font-size:14px;line-height:1.5;color:${MUTED};">Please complete by <strong style="color:${INK};">${escapeHtml(closes)}</strong>.</p>`
                  : `<div style="height:8px;"></div>`
              }
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                <tr>
                  <td style="border-radius:8px;background:${JADE};">
                    <a href="${escapeHtml(respondUrl)}" style="display:inline-block;padding:14px 22px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">${escapeHtml(copy.cta)}</a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px;font-size:13px;line-height:1.5;color:${MUTED};">If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="margin:0 0 20px;font-size:12px;line-height:1.5;word-break:break-all;color:${JADE};"><a href="${escapeHtml(respondUrl)}" style="color:${JADE};">${escapeHtml(respondUrl)}</a></p>
              <p style="margin:0;font-size:13px;line-height:1.55;color:${MUTED};">${escapeHtml(privacyCopy)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 28px;background:${SURFACE};border-top:1px solid ${BORDER};">
              <p style="margin:0;font-size:12px;line-height:1.5;color:${MUTED};">Sent with <a href="https://appraisalsoftware.co.uk" style="color:${JADE};text-decoration:none;">Appraisal Software</a> — structured appraisals for modern teams.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = [
    greeting.replace(/,/g, ""),
    "",
    copy.title,
    copy.body,
    `Campaign: ${campaignName}`,
    closes ? `Please complete by ${closes}.` : null,
    "",
    `${copy.cta}: ${respondUrl}`,
    "",
    privacyCopy,
    "",
    "— Appraisal Software (appraisalsoftware.co.uk)",
  ]
    .filter(Boolean)
    .join("\n");

  return { html, text, respondUrl };
}
