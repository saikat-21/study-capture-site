# Supabase Production Backend

## Required Tables

The production schema is in `supabase/schema.sql` and creates:

- `users`
- `payments`
- `subscriptions`
- `licenses`
- `devices`
- `webhook_events`
- `auth_events`

Run the full SQL file in the Supabase SQL editor before sending live payments.

If Supabase reports duplicate `payments.provider_order_id` rows before the new
unique index can be created, run
`supabase/cleanup-payments-provider-order-duplicates.sql` first. It preserves all
rows, archives duplicate order IDs to unique values, and then creates the
PostgREST-compatible unique index required by payment upserts.

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

## Auth / Verification Code

Study Capture uses one auth flow only: numeric email verification code.

Do not use magic links for Study Capture login. The UI accepts a numeric 6-8 digit verification code, and `/api/auth/verify-otp` verifies the full token with Supabase `verifyOtp({ type: "email" })`.

The site uses these backend routes:

- `/api/auth/send-otp`
- `/api/auth/verify-otp`

`/api/auth/send-otp` calls Supabase `signInWithOtp` with:

- `shouldCreateUser: true`

It intentionally does not pass `emailRedirectTo`; Study Capture does not use link-based login, activation links, or magic links.

### Supabase Auth URL Configuration

In Supabase Dashboard:

1. Open `Authentication`.
2. Open `URL Configuration`.
3. Set `Site URL` to:

```text
https://studycapture.co
```

4. Add these `Redirect URLs`:

```text
https://studycapture.co/**
https://www.studycapture.co/**
https://studycapture.co/login
https://www.studycapture.co/login
```

Do not leave `localhost:3000` as the production Site URL. Keep localhost only for a separate local/dev project or local-only redirect entry.

### Supabase Email Templates

In Supabase Dashboard:

1. Open `Authentication`.
2. Open `Email Templates`.
3. Open the `Magic Link` template. Supabase labels this template `Magic Link`, but Study Capture configures it as numeric verification code only.
4. Replace the link-based content with a numeric verification-code template that includes `{{ .Token }}`.
5. Remove `{{ .ConfirmationURL }}` entirely from the template so the email does not present a login link.
6. Open the `Confirm signup` template and paste the same numeric verification-code template there too.
7. Remove `{{ .ConfirmationURL }}` and any activation/confirmation links from the `Confirm signup` template.

This two-template setup matters because existing users and newly created users can receive different Supabase auth templates. Both templates must show only the numeric token for a predictable Gmail, iCloud, Outlook, and custom-domain experience.

Use `supabase/email-otp-template.html`, or paste this minimal template:

```html
<h2>Study Capture verification code</h2>
<p>Your verification code is: <strong>{{ .Token }}</strong></p>
<p>Enter this verification code on the Study Capture login screen.</p>
```

Supabase documents this behavior in its [`signInWithOtp` reference](https://supabase.com/docs/reference/javascript/auth-signinwithotp): the email sends a magic link when the template uses `{{ .ConfirmationURL }}`, and sends a code when it uses `{{ .Token }}`.

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
5. Upsert an `active` `pro_lifetime` subscription row.
6. Send the welcome/license email when Resend is configured.

The webhook endpoint is the source-of-truth fallback and is idempotent through `webhook_events`.
`payment.failed` webhooks are recorded as failed payment rows and never activate a license.

## Extension License API

The extension activates Pro through:

- `POST /api/license/activate`
- `GET /api/license/status`

Activation requires the paid email, license reference, and device details. The server verifies the license state and device limit before returning a signed token. The extension revalidates that token against `/api/license/status`.

## Account Login

Customer account URL:

```text
https://studycapture.co/login
```

This uses the same Supabase email verification-code flow as license management. After code verification, `/api/account/me` returns the server-verified user, license, subscription, payment, and device records.

## Admin Dashboard

Admin URL:

```text
https://studycapture.co/admin
https://studycapture.co/admin/debug
```

Access requires:

1. Supabase email verification code.
2. The verified email must be listed in `ADMIN_EMAILS`.

The dashboard shows users, paid/pending payments, active subscriptions, Pro licenses, active devices, gross revenue, recent activity, and an admin license update form for refunds, chargebacks, bans, and device-limit adjustments. The debug page shows recent payments, licenses, device activations, and activation/deactivation events for founder verification.

## Row Level Security

RLS is enabled for all application tables.

- Authenticated users can select only their own `users`, `payments`, `subscriptions`, `licenses`, and `devices`.
- `webhook_events` and `auth_events` have no anon/authenticated policies.
- Server API routes use `SUPABASE_SERVICE_ROLE_KEY` and perform ownership/admin checks before writing.

Do not query service-role routes directly from the browser.
