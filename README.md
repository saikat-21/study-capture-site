# Study Capture Site

Official website and Pro upgrade funnel for the Study Capture browser extension.

## Stack

- Next.js App Router
- Tailwind CSS
- Razorpay Orders + Checkout + webhooks
- Supabase Auth email OTP
- Server-side license and device APIs
- Extension activation with email + license reference
- Supabase subscriptions and account login
- Vercel-ready configuration

## Key Routes

- `/` landing page
- `/admin` OTP-protected admin dashboard
- `/login` passwordless account login/signup
- `/install` browser-aware install page
- `/upgrade` email-first Pro upgrade flow
- `/checkout` Razorpay Checkout payment flow
- `/success` Pro welcome and activation next steps
- `/manage-license` passwordless device management
- `/api/razorpay/create-order`
- `/api/razorpay/verify-payment`
- `/api/razorpay/webhook`
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

See:

- `supabase/schema.sql`
- `SUPABASE_PRODUCTION.md`
- `PAYMENT_SETUP.md`
- `TESTING.md`
- `docs/deployment-vercel.md`
- `docs/testing-checklist.md`
