# Razorpay Payment Setup

## Vercel Environment Variables

Set these in Vercel:

```text
RAZORPAY_KEY_ID=<live key id>
RAZORPAY_KEY_SECRET=<live key secret>
NEXT_PUBLIC_RAZORPAY_KEY_ID=<same live key id>
RAZORPAY_WEBHOOK_SECRET=<webhook secret you create in Razorpay>
NEXT_PUBLIC_SITE_URL=https://studycapture.co
NEXT_PUBLIC_BILLING_EMAIL=billing@studycapture.co
```

`RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET` must stay server-only.

## Webhook URL

Paste this URL in the Razorpay Dashboard webhook setup:

```text
https://studycapture.co/api/razorpay/webhook
```

In Razorpay Dashboard live mode:

1. Open Dashboard.
2. Go to Account & Settings.
3. Open Webhooks.
4. Add a new webhook.
5. Paste `https://studycapture.co/api/razorpay/webhook`.
6. Enter a strong webhook secret and copy it to Vercel as `RAZORPAY_WEBHOOK_SECRET`.
7. Select these events:
   - `payment.captured`
   - `order.paid`
   - `payment.failed`

## Implemented Flow

1. `/upgrade` captures the license email and preserves `src` and `reason`.
2. `/checkout` calls `/api/razorpay/create-order`.
3. The server creates a Razorpay order for `79900` paise in `INR`.
4. The browser opens Razorpay Checkout using `order_id`.
5. Checkout returns `razorpay_payment_id`, `razorpay_order_id`, and `razorpay_signature`.
6. `/api/razorpay/verify-payment` verifies the signature with `RAZORPAY_KEY_SECRET`.
7. The app marks the email Pro Lifetime in `lib/db.js`, creates `SC-PRO-YYYY-XXXXXX`, upserts an active `pro_lifetime` subscription, and redirects to `/success`.
8. A Resend-backed welcome email is sent with the license reference when `RESEND_API_KEY` is configured.
9. `/api/razorpay/webhook` verifies `X-Razorpay-Signature` using the raw request body and handles duplicate events idempotently. Failed payments are recorded without activating a license.
10. The extension Activate Pro flow sends the email, license reference, and device fingerprint to `/api/license/activate`; the server verifies the paid license before issuing a signed device token.

## Persistence

`lib/db.js` uses Supabase when `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are configured. Without those env vars it uses an in-memory mock store for local development. The in-memory store is not durable on Vercel and should not be used as the production source of truth.
