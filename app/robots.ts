import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/login", "/signup", "/forgot-password", "/reset-password", "/verify-email", "/auth/", "/app/", "/dashboard/", "/projects/", "/assets/", "/history/", "/settings/", "/admin/", "/workspace/"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl(),
  };
}
