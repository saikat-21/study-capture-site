# Study Capture Site

Official website and Pro upgrade funnel for the Study Capture browser extension.

## Stack

- Next.js App Router
- Tailwind CSS
- Razorpay Orders + Checkout + webhooks
- Supabase Auth email OTP
- Server-side license and device APIs
- Extension activation with email OTP/session grants
- Supabase subscriptions and account login
- Vercel-ready configuration

## Key Routes

- `/` landing page
- `/admin` OTP-protected admin dashboard
- `/admin/debug` founder-only production debug view
- `/login` passwordless account login/signup
- `/install` browser-aware install page
- `/upgrade` email-first Pro upgrade flow
- `/checkout` Razorpay Checkout payment flow
- `/success` Pro welcome and activation next steps
- `/manage-license` passwordless device management
- `/api/razorpay/create-order`
- `/api/razorpay/verify-payment`
- `/api/razorpay/webhook`
- `/api/checkout/price`
- `/api/admin/overview`
- `/api/admin/licenses/update`
- `/api/account/me`
- `/api/auth/send-otp`
- `/api/auth/verify-otp`
- `/api/license/activate`
- `/api/license/status`
- `/api/license/deactivate-device`

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Production Build

```bash
npm run lint
npm run build
```

## Deployment

Import this repository into Vercel. The project uses the Next.js framework preset and builds with `npm run build`.

## Founder Live Test Mode

Public users always see and pay the public price. For a live ₹1 founder-only payment test, set `ENABLE_INTERNAL_TEST_PAYMENTS=true`, `FOUNDER_TEST_TOKEN=<secret-random-string>`, `TEST_PRICE_INR=1`, `PUBLIC_PRICE_INR=499`, and `ORIGINAL_PRICE_INR=799` in Vercel, then open:

```text
https://www.studycapture.co/upgrade?src=extension&test=1&token=<FOUNDER_TEST_TOKEN>
```

The backend verifies the token before creating the Razorpay order. Wrong, missing, or disabled tokens fall back to ₹499.

See:

- `supabase/schema.sql`
- `SUPABASE_PRODUCTION.md`
- `PAYMENT_SETUP.md`
- `TESTING.md`
- `docs/deployment-vercel.md`
- `docs/testing-checklist.md`
