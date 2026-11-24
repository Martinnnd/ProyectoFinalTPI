import type { NextConfig } from "next";
const config: NextConfig = {
  devIndicators: false,
  reactStrictMode: false,
  async headers() {
    if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) return [];

    return [
      {
        source: "/auth/login",
        headers: [{ key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" }],
      },
    ];
  },
};
export default config;
