# Vercel Deployment Notes

## Environment Variables

Set these in Vercel Project Settings:

- `NEXT_PUBLIC_SITE_URL=https://studycapture.co`
- `SUPABASE_AUTH_REDIRECT_URL=https://studycapture.co`
- `NEXT_PUBLIC_CONTACT_EMAIL=support@studycapture.co`
- `NEXT_PUBLIC_SUPPORT_EMAIL=support@studycapture.co`
- `NEXT_PUBLIC_BILLING_EMAIL=billing@studycapture.co`
- `NEXT_PUBLIC_FOUNDER_EMAIL=founder@studycapture.co`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `NEXT_PUBLIC_RAZORPAY_KEY_ID`
- `RAZORPAY_WEBHOOK_SECRET`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `LICENSE_TOKEN_SECRET`
- `DEVICE_HASH_SECRET`
- `RATE_LIMIT_SECRET`
- `ADMIN_EMAILS=founder@studycapture.co`
- `NEXT_PUBLIC_CHROME_STORE_URL`
- `NEXT_PUBLIC_EDGE_STORE_URL`
- `NEXT_PUBLIC_FIREFOX_STORE_URL`
- `NEXT_PUBLIC_SAFARI_STORE_URL`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL=Study Capture <billing@studycapture.co>`

Never expose `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `LICENSE_TOKEN_SECRET`, `DEVICE_HASH_SECRET`, `RATE_LIMIT_SECRET`, `ADMIN_EMAILS`, or `RESEND_API_KEY` with a `NEXT_PUBLIC_` prefix.

## Razorpay

The webhook URL is:

```text
https://studycapture.co/api/razorpay/webhook
```

Add it in Razorpay Dashboard live mode under webhooks and subscribe to:

- `payment.captured`
- `order.paid`
- `payment.failed`

Use the same webhook secret in Razorpay and Vercel as `RAZORPAY_WEBHOOK_SECRET`.

## Supabase

The Razorpay flow works with the in-memory mock DB when Supabase is not configured, but production should use Supabase/Postgres persistence:

1. Create a Supabase project.
2. Run `supabase/schema.sql`.
3. Add the Supabase env vars to Vercel.
4. Keep RLS enabled. API routes use `SUPABASE_SERVICE_ROLE_KEY` and perform server-side ownership checks.

`/api/license/activate` and `/api/license/status` require durable license/device rows in production, so do not rely on the in-memory mock for the live extension activation flow.

## Supabase Auth

Study Capture uses numeric 6-digit email OTP only.

In Supabase Dashboard, set:

- Site URL: `https://studycapture.co`
- Redirect URLs:
  - `https://studycapture.co/**`
  - `https://www.studycapture.co/**`
  - `https://studycapture.co/login`
  - `https://www.studycapture.co/login`

In `Authentication > Email Templates`, open the template labelled `Magic Link`, replace the link-based content with the numeric OTP template containing `{{ .Token }}`, and remove `{{ .ConfirmationURL }}` entirely. See `supabase/email-otp-template.html`.

## Admin

Open `/admin` and sign in with email OTP. Only emails listed in `ADMIN_EMAILS` can load admin data or update license state.

## Build

Vercel should use:

- Install command: `npm install`
- Build command: `npm run build`
- Output: Next.js default
