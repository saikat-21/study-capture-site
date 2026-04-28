export const OTP_MAX_LENGTH = 8;
export const OTP_PATTERN = "[0-9]{6,8}";

export function normalizeOtpInput(value) {
  return String(value ?? "").trim();
}

export function handleOtpPaste(event, setOtp) {
  const pasted = event.clipboardData?.getData("text");
  if (typeof pasted !== "string") return;

  const token = normalizeOtpInput(pasted);
  if (/^\d{1,8}$/.test(token)) {
    event.preventDefault();
    setOtp(token);
  }
}
