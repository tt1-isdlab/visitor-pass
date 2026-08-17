import { prisma } from "@/lib/db";
import type { VisitorRegistration } from "@/generated/prisma/client";

const BRAND = {
  name: "RoboFest 2.0",
  contactEmail: "contact@robofest.example",
  contactPhone: "+91 90000 00000",
};

function shell(title: string, bodyHtml: string) {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#0a0e17;font-family:Arial,Helvetica,sans-serif;color:#e2e8f0;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0e17;padding:32px 0;">
      <tr><td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#111827;border:1px solid #1f2937;border-radius:12px;overflow:hidden;">
          <tr><td style="background:linear-gradient(90deg,#0ea5e9,#22d3ee);padding:20px 28px;">
            <span style="font-size:20px;font-weight:800;letter-spacing:1px;color:#04121c;">ROBOFEST 2.0</span>
          </td></tr>
          <tr><td style="padding:28px;">
            <h1 style="font-size:18px;margin:0 0 16px;color:#f8fafc;">${title}</h1>
            ${bodyHtml}
          </td></tr>
          <tr><td style="padding:20px 28px;border-top:1px solid #1f2937;font-size:12px;color:#64748b;">
            Questions? Contact us at ${BRAND.contactEmail} / ${BRAND.contactPhone}<br/>
            &copy; ${new Date().getFullYear()} RoboFest 2.0. All rights reserved.
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

function row(label: string, value: string) {
  return `<tr><td style="padding:4px 0;color:#94a3b8;font-size:13px;">${label}</td><td style="padding:4px 0;color:#f1f5f9;font-size:13px;font-weight:600;text-align:right;">${value}</td></tr>`;
}

export function renderRegistrationReceivedEmail(reg: VisitorRegistration) {
  const subject = "RoboFest 2.0 — Visitor Pass Registration Received";
  const html = shell(
    "Registration Received",
    `<p style="color:#cbd5e1;font-size:14px;line-height:1.6;">Hi ${reg.fullName}, thanks for registering for RoboFest 2.0. Your application is now under review.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;background:#0b1220;border-radius:8px;padding:16px;">
      ${row("Registration ID", reg.registrationId)}
      ${row("Status", "UNDER REVIEW")}
      ${row("Visitor Type", reg.visitorType)}
    </table>
    <p style="color:#94a3b8;font-size:13px;line-height:1.6;">Keep your Registration ID handy — you'll use it (with your email) to check your status at any time on the RoboFest visitor status page, and to download your pass once approved.</p>`
  );
  const text = `RoboFest 2.0 — Registration Received\n\nHi ${reg.fullName},\nYour registration (${reg.registrationId}) is under review.\nStatus: UNDER REVIEW\n\nContact: ${BRAND.contactEmail}`;
  return { subject, html, text };
}

export function renderApprovedEmail(reg: VisitorRegistration, passUrl: string) {
  const subject = "RoboFest 2.0 — Visitor Pass Approved";
  const html = shell(
    "Your Visitor Pass is Approved",
    `<p style="color:#cbd5e1;font-size:14px;line-height:1.6;">Congratulations ${reg.fullName}! Your RoboFest 2.0 visitor pass application has been approved.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;background:#0b1220;border-radius:8px;padding:16px;">
      ${row("Registration ID", reg.registrationId)}
      ${row("Status", "APPROVED")}
    </table>
    <p style="text-align:center;margin:24px 0;">
      <a href="${passUrl}" style="background:#22d3ee;color:#04121c;text-decoration:none;font-weight:700;padding:12px 24px;border-radius:8px;display:inline-block;">Download Your Visitor Pass</a>
    </p>
    <p style="color:#94a3b8;font-size:13px;line-height:1.6;">Please bring your digital or printed pass and a valid photo ID to the venue. Present the QR code at entry for check-in.</p>`
  );
  const text = `RoboFest 2.0 — Visitor Pass Approved\n\nHi ${reg.fullName},\nYour registration (${reg.registrationId}) is APPROVED.\nDownload your pass: ${passUrl}`;
  return { subject, html, text };
}

export function renderRejectedEmail(reg: VisitorRegistration) {
  const subject = "RoboFest 2.0 — Visitor Pass Application Update";
  const html = shell(
    "Application Update",
    `<p style="color:#cbd5e1;font-size:14px;line-height:1.6;">Hi ${reg.fullName}, unfortunately your RoboFest 2.0 visitor pass application could not be approved.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;background:#0b1220;border-radius:8px;padding:16px;">
      ${row("Registration ID", reg.registrationId)}
      ${row("Status", "REJECTED")}
    </table>
    <p style="color:#f87171;font-size:13px;line-height:1.6;"><strong>Reason:</strong> ${reg.rejectionReason ?? "Not specified"}</p>
    <p style="color:#94a3b8;font-size:13px;line-height:1.6;">If you believe this is a mistake, please contact us at ${BRAND.contactEmail}.</p>`
  );
  const text = `RoboFest 2.0 — Application Update\n\nHi ${reg.fullName},\nYour registration (${reg.registrationId}) was REJECTED.\nReason: ${reg.rejectionReason ?? "Not specified"}`;
  return { subject, html, text };
}

export function renderReminderEmail(reg: VisitorRegistration, passUrl: string) {
  const subject = "RoboFest 2.0 — See You There! Event Reminder";
  const html = shell(
    "Event Reminder",
    `<p style="color:#cbd5e1;font-size:14px;line-height:1.6;">Hi ${reg.fullName}, RoboFest 2.0 is coming up soon! Here's a quick reminder to bring your visitor pass.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;background:#0b1220;border-radius:8px;padding:16px;">
      ${row("Registration ID", reg.registrationId)}
    </table>
    <p style="text-align:center;margin:24px 0;">
      <a href="${passUrl}" style="background:#22d3ee;color:#04121c;text-decoration:none;font-weight:700;padding:12px 24px;border-radius:8px;display:inline-block;">View Your Visitor Pass</a>
    </p>`
  );
  const text = `RoboFest 2.0 — Event Reminder\n\nHi ${reg.fullName}, see you soon! Registration ID: ${reg.registrationId}\nPass: ${passUrl}`;
  return { subject, html, text };
}

/**
 * Emails are queued (stored in email_logs) rather than sent automatically —
 * transactional sending is handled manually for now. To wire up a live
 * provider later, add the send call here and flip status to SENT/FAILED.
 */
export async function queueEmail(params: {
  registrationId: string;
  toEmail: string;
  templateType: "REGISTRATION_RECEIVED" | "APPROVED" | "REJECTED" | "REMINDER";
  subject: string;
  html: string;
  text: string;
}) {
  return prisma.emailLog.create({
    data: {
      registrationId: params.registrationId,
      toEmail: params.toEmail,
      templateType: params.templateType,
      subject: params.subject,
      bodyHtml: params.html,
      bodyText: params.text,
      status: "QUEUED",
    },
  });
}
