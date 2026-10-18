import { EMAIL_LOGO_URL, PLATFORM_JADE } from "@/lib/branding";

const INK = "#171714";
const MUTED = "#6b635a";
const SURFACE = "#f7f5f1";
const BORDER = "#e8e4dc";

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Email inviting a colleague to co-administer a workspace. */
export function buildAdminInviteEmail(params: {
  inviteUrl: string;
  orgName: string;
  inviterName: string;
}): { subject: string; html: string; text: string } {
  const org = params.orgName.trim() || "your team";
  const inviter = params.inviterName.trim() || "A colleague";
  const subject = `${inviter} invited you to ${org} on Appraisal Software`;
  const url = escapeHtml(params.inviteUrl);

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:${SURFACE};font-family:Inter,Segoe UI,Helvetica,Arial,sans-serif;color:${INK};">
  <span style="display:none;max-height:0;overflow:hidden;">Join ${escapeHtml(org)} to run appraisals together. The link works for 14 days.</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${SURFACE};padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border:1px solid ${BORDER};border-radius:12px;overflow:hidden;">
        <tr><td style="padding:28px 28px 12px;border-bottom:3px solid ${PLATFORM_JADE};">
          <img src="${EMAIL_LOGO_URL}" alt="Appraisal Software" width="40" height="40" style="display:block;width:40px;height:40px;border:0;" />
        </td></tr>
        <tr><td style="padding:28px;">
          <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;font-weight:600;">Join ${escapeHtml(org)}</h1>
          <p style="margin:0 0 20px;font-size:15px;line-height:1.55;">${escapeHtml(inviter)} has invited you to help run appraisals and 360 feedback for <strong>${escapeHtml(org)}</strong> as an admin.</p>
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px;"><tr>
            <td style="border-radius:8px;background:${PLATFORM_JADE};"><a href="${url}" style="display:inline-block;padding:14px 22px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">Accept invitation</a></td>
          </tr></table>
          <p style="margin:0 0 8px;font-size:13px;line-height:1.5;color:${MUTED};">If the button doesn't work, paste this link into your browser:</p>
          <p style="margin:0 0 20px;font-size:12px;line-height:1.5;word-break:break-all;"><a href="${url}" style="color:${PLATFORM_JADE};">${url}</a></p>
          <p style="margin:0;font-size:13px;line-height:1.55;color:${MUTED};">The invitation works for 14 days. If you weren't expecting it, you can ignore this email.</p>
        </td></tr>
        <tr><td style="padding:18px 28px;background:${SURFACE};border-top:1px solid ${BORDER};">
          <p style="margin:0;font-size:12px;line-height:1.5;color:${MUTED};">Sent with <a href="https://appraisalsoftware.co.uk" style="color:${PLATFORM_JADE};text-decoration:none;">Appraisal Software</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = [
    `Join ${org}`,
    "",
    `${inviter} has invited you to help run appraisals and 360 feedback for ${org} as an admin.`,
    "",
    `Accept the invitation: ${params.inviteUrl}`,
    "",
    "The invitation works for 14 days. If you weren't expecting it, you can ignore this email.",
    "",
    "— Appraisal Software (appraisalsoftware.co.uk)",
  ].join("\n");

  return { subject, html, text };
}
