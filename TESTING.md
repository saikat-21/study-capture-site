# Razorpay Testing Checklist

## Order Creation

- Add Razorpay env vars to `.env.local`.
- Visit `/upgrade?src=extension&reason=pdf_limit`.
- Enter an email and continue to `/checkout`.
- Click `Pay ₹799 securely`.
- Confirm `/api/razorpay/create-order` returns:
  - `order_id`
  - `amount: 79900`
  - `currency: INR`
  - `key_id`

## Razorpay Checkout

- Confirm the Razorpay popup opens.
- Confirm UPI, credit card, debit card, and netbanking are available in Razorpay Checkout.
- Confirm the order amount is ₹799.
- Confirm the prefilled email matches the email entered on `/upgrade`.

## Signature Verification

- Confirm `/api/razorpay/verify-payment` rejects an invalid `razorpay_signature`.
- Complete a successful Razorpay payment and confirm `/api/razorpay/verify-payment` accepts the Checkout callback.
- Confirm the response includes a license reference formatted like `SC-PRO-2026-XXXXXX`.
- Confirm `/success` displays the email and license reference.
- Confirm the welcome email is sent when `RESEND_API_KEY` is configured.
- Cancel the Razorpay modal and confirm the checkout page says the payment was cancelled and the user was not charged.
- Trigger a failed payment and confirm the checkout page shows a clean failure message.

## Extension Activation

- Open the extension after a successful purchase.
- Click `Activate Pro`.
- Enter the paid email and `SC-PRO-YYYY-XXXXXX` license reference.
- Confirm `/api/license/activate` returns a signed token and the extension switches to Pro.
- Confirm `/api/license/status` keeps Pro active for that token.
- Confirm a fourth active browser/device returns `device_limit_reached`.

## Webhook

- In Razorpay live dashboard, configure `https://studycapture.co/api/razorpay/webhook`.
- Subscribe to `payment.captured` and `order.paid`.
- Confirm webhook requests with an invalid `X-Razorpay-Signature` are rejected.
- Confirm duplicate webhook deliveries do not create duplicate licenses.
- Confirm duplicate checkout + webhook confirmations do not send duplicate welcome emails.
- Confirm webhook deliveries update payment/license state even if the browser closes after payment.

## Security

- Confirm `RAZORPAY_KEY_SECRET` is not referenced in any client component.
- Confirm `RAZORPAY_WEBHOOK_SECRET` is not referenced in any client component.
- Confirm browser bundles only include `NEXT_PUBLIC_RAZORPAY_KEY_ID`.
- Confirm the server verifies payment with HMAC SHA256 before activating Pro.
- Confirm webhook verification uses the raw request body.
