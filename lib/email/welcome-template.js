export const welcomeEmailSubject = "Welcome to Study Capture Pro 🎉";

export function buildWelcomeEmail({
  email,
  paidPriceLabel = "₹499 (Introductory)",
  originalPriceLabel = "₹799"
} = {}) {
  const safeEmail = email || "your email";

  const text = `Welcome to Study Capture Pro.

Your Pro access is active for ${safeEmail}.

Plan: Lifetime
Price paid: ${paidPriceLabel}
Original: ${originalPriceLabel}

Restore Pro access:
1. Install or open Study Capture.
2. Click Activate Pro.
3. Use the same paid email.
4. Verify with the email OTP code.

What's included:
- Unlimited PDF exports
- Unlimited Study Books
- Reading Capture Mode
- Auto Scroll Capture
- Future Pro improvements

Usage limits:
- You can use Pro on up to 3 active browsers/devices.
- Older sessions may be logged out automatically.
- Misuse or abnormal usage may lead to restriction.

Support:
support@studycapture.co`;

  const html = `
    <div style="font-family:Inter,Arial,sans-serif;background:#071014;color:#E7F4EF;padding:32px">
      <div style="max-width:640px;margin:0 auto;background:#101A20;border:1px solid rgba(231,244,239,.12);border-radius:20px;padding:32px">
        <p style="color:#5FE0B7;font-weight:700;margin:0 0 16px">Study Capture Pro</p>
        <h1 style="font-size:32px;line-height:1.15;margin:0 0 20px;color:#fff">Welcome to Study Capture Pro.</h1>
        <p style="font-size:16px;line-height:1.7;color:rgba(231,244,239,.76)">Your Pro access is active for <strong style="color:#fff">${safeEmail}</strong>.</p>
        <div style="background:rgba(95,224,183,.10);border:1px solid rgba(95,224,183,.22);border-radius:16px;padding:18px;margin:24px 0">
          <p style="margin:0 0 8px;color:#fff;font-weight:700">Plan: Lifetime</p>
          <p style="margin:0 0 8px;color:rgba(231,244,239,.76)">Price paid: <strong style="color:#fff">${paidPriceLabel}</strong></p>
          <p style="margin:0;color:rgba(231,244,239,.66)">Original: <span style="text-decoration:line-through">${originalPriceLabel}</span></p>
        </div>
        <h2 style="font-size:18px;color:#fff;margin:28px 0 12px">Restore Pro access</h2>
        <ol style="line-height:1.8;color:rgba(231,244,239,.76);padding-left:20px">
          <li>Install or open Study Capture.</li>
          <li>Click Activate Pro.</li>
          <li>Use the same paid email.</li>
          <li>Verify with the email OTP code.</li>
        </ol>
        <h2 style="font-size:18px;color:#fff;margin:28px 0 12px">Your Pro features</h2>
        <ul style="line-height:1.8;color:rgba(231,244,239,.76);padding-left:20px">
          <li>Unlimited PDF exports</li>
          <li>Unlimited Study Books</li>
          <li>Reading Capture Mode</li>
          <li>Auto Scroll Capture</li>
          <li>Future Pro improvements</li>
        </ul>
        <h2 style="font-size:18px;color:#fff;margin:28px 0 12px">Usage limits</h2>
        <ul style="line-height:1.8;color:rgba(231,244,239,.76);padding-left:20px">
          <li>You can use Pro on up to 3 active browsers/devices.</li>
          <li>Older sessions may be logged out automatically.</li>
          <li>Misuse or abnormal usage may lead to restriction.</li>
        </ul>
        <p style="font-size:15px;line-height:1.7;color:rgba(231,244,239,.72)">Need help? Email <a href="mailto:support@studycapture.co" style="color:#5FE0B7">support@studycapture.co</a>.</p>
      </div>
    </div>`;

  return { subject: welcomeEmailSubject, text, html };
}
