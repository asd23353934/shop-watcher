import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/login"],
      disallow: [
        "/dashboard",
        "/settings",
        "/keywords",
        "/history",
        "/circles",
        "/status",
        "/api/",
      ],
    },
    sitemap: "https://shop-watcher.vercel.app/sitemap.xml",
  };
}
