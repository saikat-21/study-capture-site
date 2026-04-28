# Study Capture Production Test Checklist

Use this checklist after every production deploy touching payments, Supabase, email, licensing, or the extension activation flow.

## Test Data

- Use a real inbox you can access.
- Use a fresh email for the full purchase test.
- Use the same email again for the duplicate-paid-email test.
- Keep Razorpay Dashboard, Supabase Table Editor/SQL Editor, Vercel logs, and the Study Capture extension open.

## 0. Preflight

- Confirm Vercel is deployed from the latest `main` commit.
- Confirm Supabase has the latest `supabase/schema.sql` applied.
- Confirm this index exists:

```sql
select indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and tablename = 'payments'
  and indexname = 'payments_provider_order_conflict_idx';
```

- Confirm required Vercel env vars exist:
  - `RAZORPAY_KEY_ID`
  - `RAZORPAY_KEY_SECRET`
  - `NEXT_PUBLIC_RAZORPAY_KEY_ID`
  - `RAZORPAY_WEBHOOK_SECRET`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `SUPABASE_AUTH_REDIRECT_URL=https://studycapture.co`
  - `LICENSE_TOKEN_SECRET`
  - `DEVICE_HASH_SECRET`
  - `RATE_LIMIT_SECRET`
  - `ADMIN_EMAILS=founder@studycapture.co`
  - `RESEND_API_KEY`
  - `RESEND_FROM_EMAIL=Study Capture <billing@studycapture.co>`

## 0.1 Supabase Numeric OTP Auth

Study Capture uses numeric email verification code only. Do not mix this with magic-link login.

In Supabase Dashboard, confirm:

- `Authentication > URL Configuration > Site URL` is `https://studycapture.co`.
- Redirect URLs include:
  - `https://studycapture.co/**`
  - `https://www.studycapture.co/**`
  - `https://studycapture.co/login`
  - `https://www.studycapture.co/login`
- `Authentication > Email Templates > Magic Link` contains `{{ .Token }}`.
- The same email template does not include `{{ .ConfirmationURL }}`.
- The production OTP email does not link users to `localhost:3000`.

Run:

1. Open `https://studycapture.co/login`.
2. Enter an email.
3. Confirm the email contains a numeric verification code.
4. Enter the code on `/login`.
5. Confirm the account page opens.

Expected:

- No password is requested.
- No magic-link click is required.
- No production email redirects to `localhost:3000`.

## 1. Razorpay Payment Captured

1. Open `https://studycapture.co/upgrade?src=website`.
2. Enter a fresh email.
3. Continue to `/checkout`.
4. Click `Pay ₹799 securely`.
5. Complete the Razorpay payment.
6. In Razorpay Dashboard, open Payments.
7. Confirm the payment status is `captured`.
8. Confirm amount is `₹799`.
9. Confirm order notes include the email and `Study Capture Pro Lifetime`.

## 2. Supabase Payment Row Created

Run:

```sql
select
  id,
  email,
  provider,
  provider_order_id,
  provider_payment_id,
  amount,
  currency,
  status,
  paid_at,
  license_id
from public.payments
where email = 'TEST_EMAIL_HERE'
order by created_at desc;
```

Confirm:

- `provider = razorpay`
- `amount = 79900`
- `currency = INR`
- `status = paid`
- `provider_order_id` starts with `order_`
- `provider_payment_id` starts with `pay_`
- `license_id` is not null after payment verification/webhook processing

## 3. Subscription Active

Run:

```sql
select
  email,
  plan,
  status,
  provider,
  provider_order_id,
  provider_payment_id,
  amount,
  currency,
  lifetime_access,
  started_at,
  ended_at
from public.subscriptions
where email = 'TEST_EMAIL_HERE';
```

Confirm:

- `plan = pro_lifetime`
- `status = active`
- `provider = razorpay`
- `amount = 79900`
- `currency = INR`
- `lifetime_access = true`
- `started_at` is not null
- `ended_at` is null

## 4. License Generated

Run:

```sql
select
  id,
  email,
  license_ref,
  state,
  max_devices,
  activated_at
from public.licenses
where email = 'TEST_EMAIL_HERE';
```

Confirm:

- `license_ref` matches `SC-PRO-YYYY-XXXXXX`
- `state = paid_lifetime`
- `max_devices = 3`
- `activated_at` is not null

## 5. Success Page Shows License Reference

After payment, confirm `/success` shows:

- “Excellent choice — welcome to Study Capture Pro.”
- Pro active for the paid email.
- License reference matching the Supabase `licenses.license_ref`.
- Next steps mention extension activation with the same email and license reference.

## 6. Welcome / License Email Sent

Check the paid email inbox.

Confirm the welcome email:

- Subject: `Welcome to Study Capture Pro — License Activated 🎉`
- Sent from the configured Resend sender.
- Includes the paid email.
- Includes the same `SC-PRO-YYYY-XXXXXX` license reference.
- Includes `billing@studycapture.co` for billing/refunds/invoices/license purchase questions.
- Includes `support@studycapture.co` for product help.

If no email arrives:

- Check Vercel logs for `Welcome email delivery failed`.
- Confirm `RESEND_API_KEY` and `RESEND_FROM_EMAIL` are configured.
- Confirm the domain/sender is verified in Resend.

## 7. Extension Activate Pro Unlocks Pro

1. Install/open the Study Capture extension.
2. Click `Activate Pro`.
3. Enter the paid email.
4. Enter the `SC-PRO-YYYY-XXXXXX` license reference.
5. Submit activation.
6. Confirm the extension switches from Free to Pro.
7. Confirm Pro-only features unlock:
   - Unlimited PDF exports
   - Unlimited Study Books
   - Reading Capture Mode
   - Auto Scroll Capture

Run:

```sql
select
  d.id,
  l.email,
  l.license_ref,
  d.browser_name,
  d.os,
  d.extension_version,
  d.first_seen_at,
  d.last_seen_at,
  d.deactivated_at
from public.devices d
join public.licenses l on l.id = d.license_id
where l.email = 'TEST_EMAIL_HERE'
order by d.last_seen_at desc;
```

Confirm one active device exists with `deactivated_at is null`.

## 8. 3-Device Limit Works

Activate Pro with the same paid email/license reference on three distinct browser profiles/devices.

Confirm:

```sql
select count(*) as active_devices
from public.devices d
join public.licenses l on l.id = d.license_id
where l.email = 'TEST_EMAIL_HERE'
  and d.deactivated_at is null;
```

Expected:

- `active_devices = 3`
- All 3 extension instances remain Pro.

## 9. 4th Device Blocked

Activate Pro on a fourth distinct browser profile/device using the same email/license reference.

Expected extension result:

- Activation fails cleanly.
- User sees a device limit message.

Expected API result:

```json
{
  "ok": false,
  "code": "device_limit_reached"
}
```

Confirm active devices remain `3` in Supabase.

## 10. Duplicate Paid Email Cannot Pay Again Accidentally

1. Open `https://studycapture.co/upgrade?src=website`.
2. Enter the same email that already has `paid_lifetime`.
3. Continue to checkout.
4. Click `Pay ₹799 securely`.

Expected:

- Razorpay Checkout does not open.
- `/api/razorpay/create-order` returns `409 already_pro`.
- The checkout page tells the user the email already has Pro and shows the existing license reference when available.

Confirm no new pending order was created:

```sql
select count(*) as recent_pending_orders
from public.payments
where email = 'TEST_EMAIL_HERE'
  and status = 'pending'
  and created_at > now() - interval '10 minutes';
```

Expected:

- `recent_pending_orders = 0`

## 11. Failed / Cancelled Payment Does Not Create License

### Cancelled Checkout

1. Open `/upgrade` with a brand-new unpaid email.
2. Continue to `/checkout`.
3. Click `Pay ₹799 securely`.
4. Close/dismiss the Razorpay modal.

Expected:

- Checkout page says payment was cancelled and user was not charged.
- No `paid_lifetime` license exists.

Run:

```sql
select *
from public.licenses
where email = 'CANCELLED_TEST_EMAIL_HERE';
```

Expected:

- No row, or `state` is not `paid_lifetime`.

### Failed Payment

Trigger a failed Razorpay payment.

Expected:

- Payment row may exist with `status = failed`.
- No active subscription exists.
- No `paid_lifetime` license exists.

Run:

```sql
select status, provider_order_id, provider_payment_id
from public.payments
where email = 'FAILED_TEST_EMAIL_HERE'
order by created_at desc;

select state
from public.licenses
where email = 'FAILED_TEST_EMAIL_HERE';

select status
from public.subscriptions
where email = 'FAILED_TEST_EMAIL_HERE';
```

Expected:

- Latest payment is `failed` if Razorpay sent `payment.failed`.
- License is absent or not `paid_lifetime`.
- Subscription is absent or not `active`.

## 12. Webhook Idempotency

In Razorpay Dashboard, resend the same `payment.captured` webhook.

Confirm:

- `/api/razorpay/webhook` returns success.
- No duplicate license is created.
- No duplicate active subscription is created.
- Welcome email is not sent again for an already-active license.

Run:

```sql
select count(*)
from public.licenses
where email = 'TEST_EMAIL_HERE';

select count(*)
from public.subscriptions
where email = 'TEST_EMAIL_HERE'
  and plan = 'pro_lifetime';

select provider, event_id, event_type, processed_at
from public.webhook_events
order by processed_at desc
limit 10;
```

Expected:

- One license row.
- One `pro_lifetime` subscription row.
- Webhook event is recorded once per Razorpay event ID.

## 13. Founder Admin / Debug Page

1. Open `https://studycapture.co/admin/debug`.
2. Login with `founder@studycapture.co`.
3. Verify the email code.

Confirm the page shows:

- Recent payments
- Recent licenses
- Recent device activations
- Recent activation/deactivation events

Also test non-admin access:

1. Open `/admin/debug`.
2. Login with an email not listed in `ADMIN_EMAILS`.
3. Confirm API returns `admin_forbidden`.

## 14. Security Checks

- Confirm `RAZORPAY_KEY_SECRET` is not referenced in any client component.
- Confirm `RAZORPAY_WEBHOOK_SECRET` is not referenced in any client component.
- Confirm `SUPABASE_SERVICE_ROLE_KEY` is not referenced in any client component.
- Confirm browser bundles only include `NEXT_PUBLIC_RAZORPAY_KEY_ID`.
- Confirm payment verification uses HMAC SHA256 server-side.
- Confirm webhook verification uses the raw request body.
- Confirm RLS is enabled on:
  - `users`
  - `payments`
  - `subscriptions`
  - `licenses`
  - `devices`
  - `webhook_events`
  - `auth_events`

## Release Sign-Off

Release is ready when all are true:

- Razorpay captured payment.
- Supabase `payments.status = paid`.
- Supabase `subscriptions.status = active`.
- Supabase `licenses.state = paid_lifetime`.
- `/success` shows license reference.
- Welcome/license email received.
- Extension activates Pro.
- 3 active devices allowed.
- 4th active device blocked.
- Existing paid email cannot open a new Razorpay payment accidentally.
- Failed/cancelled payment does not create an active license.
- `/admin/debug` shows recent production records for founder.
