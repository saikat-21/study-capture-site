import { buildWelcomeEmail } from "../email/welcome-template";

export async function sendEmail({ to, subject, html, text }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || "Study Capture <billing@studycapture.co>";

  if (!apiKey) {
    return {
      skipped: true,
      reason: "RESEND_API_KEY is not configured."
    };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      html,
      text
    })
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Resend email failed: ${details}`);
  }

  return response.json();
}

export async function sendWelcomeEmail(email) {
  const message = buildWelcomeEmail({ email });
  try {
    return await sendEmail({ to: email, ...message });
  } catch (error) {
    console.error("Welcome email delivery failed", error);
    return {
      skipped: true,
      reason: "welcome_email_delivery_failed"
    };
  }
}
