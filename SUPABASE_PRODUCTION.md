# Supabase Production Backend

## Required Tables

The production schema is in `supabase/schema.sql` and creates:

- `users`
- `payments`
- `licenses`
- `devices`
- `webhook_events`
- `auth_events`

Run the full SQL file in the Supabase SQL editor before sending live payments.

## Environment Variables

Set these in Vercel:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
LICENSE_TOKEN_SECRET=
DEVICE_HASH_SECRET=
RATE_LIMIT_SECRET=
ADMIN_EMAILS=founder@studycapture.co
```

Keep `SUPABASE_SERVICE_ROLE_KEY`, `LICENSE_TOKEN_SECRET`, `DEVICE_HASH_SECRET`, and `RATE_LIMIT_SECRET` server-only.

## Auth / OTP

The site uses Supabase email OTP:

- `/api/auth/send-otp`
- `/api/auth/verify-otp`

In Supabase Dashboard, configure the email template to include the OTP token:

```html
<h2>Study Capture login code</h2>
<p>Your code is: {{ .Token }}</p>
```

Add `https://studycapture.co` to Supabase Auth URL configuration.

## Payment Activation

Razorpay writes durable payment records through:

- `/api/razorpay/create-order`
- `/api/razorpay/verify-payment`
- `/api/razorpay/webhook`

Successful verified payments:

1. Mark the payment as `paid`.
2. Upsert the `users` row by email.
3. Upsert a `paid_lifetime` license.
4. Attach the payment to the license.
5. Send the welcome/license email when Resend is configured.

The webhook endpoint is the source-of-truth fallback and is idempotent through `webhook_events`.
`payment.failed` webhooks are recorded as failed payment rows and never activate a license.

## Extension License API

The extension activates Pro through:

- `POST /api/license/activate`
- `GET /api/license/status`

Activation requires the paid email, license reference, and device details. The server verifies the license state and device limit before returning a signed token. The extension revalidates that token against `/api/license/status`.

## Admin Dashboard

Admin URL:

```text
https://studycapture.co/admin
```

Access requires:

1. Supabase email OTP.
2. The verified email must be listed in `ADMIN_EMAILS`.

The dashboard shows users, paid/pending payments, Pro licenses, active devices, gross revenue, recent activity, and an admin license update form for refunds, chargebacks, bans, and device-limit adjustments.

## Row Level Security

RLS is enabled for all application tables.

- Authenticated users can select only their own `users`, `payments`, `licenses`, and `devices`.
- `webhook_events` and `auth_events` have no anon/authenticated policies.
- Server API routes use `SUPABASE_SERVICE_ROLE_KEY` and perform ownership/admin checks before writing.

Do not query service-role routes directly from the browser.
