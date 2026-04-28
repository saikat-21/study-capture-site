const SITE_URL = "https://www.studycapture.co";

const routes = [
  {
    path: "/",
    changeFrequency: "weekly",
    priority: 1
  },
  {
    path: "/upgrade",
    changeFrequency: "weekly",
    priority: 0.9
  },
  {
    path: "/checkout",
    changeFrequency: "monthly",
    priority: 0.5
  },
  {
    path: "/activate",
    changeFrequency: "monthly",
    priority: 0.7
  },
  {
    path: "/success",
    changeFrequency: "monthly",
    priority: 0.4
  },
  {
    path: "/privacy",
    changeFrequency: "yearly",
    priority: 0.3
  },
  {
    path: "/terms",
    changeFrequency: "yearly",
    priority: 0.3
  },
  {
    path: "/contact",
    changeFrequency: "monthly",
    priority: 0.6
  }
];

export default function sitemap() {
  const lastModified = new Date();

  return routes.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority
  }));
}
