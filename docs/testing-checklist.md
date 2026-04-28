# Study Capture Pro Funnel Testing Checklist

See `TESTING.md` for the Razorpay-focused checklist. Keep these broader checks as release gates.

## Local Setup

- Add Razorpay, Supabase, and signing values to `.env.local`.
- Run `supabase/schema.sql` in the Supabase SQL editor if using Supabase persistence.
- Run `npm run lint`.
- Run `npm run build`.

## Upgrade Flow

- Visit `/upgrade?src=extension&reason=pdf_limit`.
- Enter an email and confirm redirect to `/checkout?src=extension&reason=pdf_limit`.
- Confirm `/checkout` shows the entered email.
- Confirm the Razorpay payment button is disabled if the email is missing.

## License Management

- Visit `/manage-license`.
- Verify with email OTP after Supabase is configured.
- Confirm plan status renders as `Free` when no paid license exists.
- Seed a `paid_lifetime` license for the same email and confirm plan status renders as `Pro Lifetime`.
- Add three active devices and confirm the count reads `3/3 active`.
- Remove one device and confirm it disappears and the active count decreases.

## Extension API

- Verify the email code through `/api/auth/verify-otp` and store the returned access token.
- Call `/api/license/activate` with `Authorization: Bearer <access_token>`.
- Confirm unpaid emails return `license_not_paid`.
- Confirm paid emails activate up to 3 devices.
- Confirm the fourth unique device returns `device_limit_reached`.
- Confirm an existing active device refreshes `last_seen_at`.
- Confirm `/api/license/status?deviceId=<id>` returns `deviceStatus: active`.
