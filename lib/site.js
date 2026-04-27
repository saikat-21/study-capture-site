export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://studycapture.co";

export const installUrl = process.env.NEXT_PUBLIC_INSTALL_URL || "/install";

export const proUrl = process.env.NEXT_PUBLIC_PRO_URL || "/upgrade";

export const contactEmail =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL || "support@studycapture.co";

export const contactMailto = `mailto:${contactEmail}`;

export const storeUrls = {
  chrome: process.env.NEXT_PUBLIC_CHROME_STORE_URL || "",
  edge: process.env.NEXT_PUBLIC_EDGE_STORE_URL || "",
  firefox: process.env.NEXT_PUBLIC_FIREFOX_STORE_URL || "",
  safari: process.env.NEXT_PUBLIC_SAFARI_STORE_URL || ""
};
