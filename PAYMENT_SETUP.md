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
PUBLIC_PRICE_INR=499
ORIGINAL_PRICE_INR=799
ENABLE_INTERNAL_TEST_PAYMENTS=false
FOUNDER_TEST_TOKEN=
TEST_PRICE_INR=1
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
3. The server creates a Razorpay order for the server-resolved price. Public checkout is `49900` paise in `INR`, with `799` stored as the original launch reference price.
4. The browser opens Razorpay Checkout using `order_id`.
5. Checkout returns `razorpay_payment_id`, `razorpay_order_id`, and `razorpay_signature`.
6. `/api/razorpay/verify-payment` verifies the signature with `RAZORPAY_KEY_SECRET`.
7. The app marks the email Pro Lifetime in `lib/db.js`, creates an internal license record/reference, and upserts an active `pro_lifetime` subscription.
8. After Pro is granted, the server sends a Resend-backed confirmation email through an idempotent `email_events` record. Email failure is logged and does not roll back payment/license activation.
9. `/api/razorpay/webhook` verifies `X-Razorpay-Signature` using the raw request body, logs the received event, and handles duplicate payment/email events idempotently. Failed payments are recorded without activating a license.
10. The extension Activate Pro flow sends the verified email activation grant/session and device fingerprint to `/api/license/activate`; the server verifies the paid license before issuing a signed device token.

## Founder Live Test Mode

For an internal live Razorpay smoke test, temporarily set `ENABLE_INTERNAL_TEST_PAYMENTS=true`, set a strong `FOUNDER_TEST_TOKEN`, and redeploy. Then use:

```text
https://www.studycapture.co/upgrade?src=extension&test=1&token=<FOUNDER_TEST_TOKEN>
```

The server validates the token before creating the order. Valid founder test orders use `100` paise, save `source = internal_test`, and keep test metadata in `payments.raw_event.study_capture`. Wrong, missing, or disabled tokens stay on the public `49900` paise path. Disable by setting `ENABLE_INTERNAL_TEST_PAYMENTS=false` and redeploying.

## Persistence

`lib/db.js` uses Supabase when `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are configured. Without those env vars it uses an in-memory mock store for local development. The in-memory store is not durable on Vercel and should not be used as the production source of truth.
