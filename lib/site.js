export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://studycapture.co";

export const installUrl = process.env.NEXT_PUBLIC_INSTALL_URL || "/install";

export const proUrl = process.env.NEXT_PUBLIC_PRO_URL || "/upgrade";

export const supportEmail =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL ||
  process.env.NEXT_PUBLIC_CONTACT_EMAIL ||
  "support@studycapture.co";

export const billingEmail =
  process.env.NEXT_PUBLIC_BILLING_EMAIL || "billing@studycapture.co";

export const founderEmail =
  process.env.NEXT_PUBLIC_FOUNDER_EMAIL || "founder@studycapture.co";

export const contactEmail = supportEmail;
export const contactMailto = `mailto:${supportEmail}`;
export const supportMailto = `mailto:${supportEmail}`;
export const billingMailto = `mailto:${billingEmail}`;
export const founderMailto = `mailto:${founderEmail}`;

export const storeUrls = {
  chrome: process.env.NEXT_PUBLIC_CHROME_STORE_URL || "",
  edge: process.env.NEXT_PUBLIC_EDGE_STORE_URL || "",
  firefox: process.env.NEXT_PUBLIC_FIREFOX_STORE_URL || "",
  safari: process.env.NEXT_PUBLIC_SAFARI_STORE_URL || ""
};
