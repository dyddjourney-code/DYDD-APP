import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/command-center/couple-report": ["./node_modules/@sparticuz/chromium/bin/**/*"],
    "/api/command-center/maps-report": ["./node_modules/@sparticuz/chromium/bin/**/*"],
  },
  async headers() {
    return ["/contact", "/admin/support"].map(source => ({ source, headers: [
      { key: "Cache-Control", value: "private, no-store, max-age=0" },
      { key: "Referrer-Policy", value: "no-referrer" },
      { key: "X-Robots-Tag", value: "noindex, nofollow" },
    ] }));
  },
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],
};

export default nextConfig;
