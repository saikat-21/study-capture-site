# Vercel Deployment Notes

## Environment Variables

Set these in Vercel Project Settings:

- `NEXT_PUBLIC_SITE_URL=https://studycapture.co`
- `NEXT_PUBLIC_CONTACT_EMAIL=support@studycapture.co`
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
- `NEXT_PUBLIC_CHROME_STORE_URL`
- `NEXT_PUBLIC_EDGE_STORE_URL`
- `NEXT_PUBLIC_FIREFOX_STORE_URL`
- `NEXT_PUBLIC_SAFARI_STORE_URL`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL=Study Capture <support@studycapture.co>`

Never expose `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `LICENSE_TOKEN_SECRET`, `DEVICE_HASH_SECRET`, `RATE_LIMIT_SECRET`, or `RESEND_API_KEY` with a `NEXT_PUBLIC_` prefix.

## Razorpay

The webhook URL is:

```text
https://studycapture.co/api/razorpay/webhook
```

Add it in Razorpay Dashboard live mode under webhooks and subscribe to:

- `payment.captured`
- `order.paid`

Use the same webhook secret in Razorpay and Vercel as `RAZORPAY_WEBHOOK_SECRET`.

## Supabase

The Razorpay flow works with the in-memory mock DB when Supabase is not configured, but production should use Supabase/Postgres persistence:

1. Create a Supabase project.
2. Run `supabase/schema.sql`.
3. Add the Supabase env vars to Vercel.
4. Keep RLS enabled. API routes use `SUPABASE_SERVICE_ROLE_KEY` and perform server-side ownership checks.

`/api/license/activate` and `/api/license/status` require durable license/device rows in production, so do not rely on the in-memory mock for the live extension activation flow.

## Build

Vercel should use:

- Install command: `npm install`
- Build command: `npm run build`
- Output: Next.js default
