import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/annual-appraisal-software", destination: "/employee-appraisal-software", statusCode: 301 },
      { source: "/360-feedback-software", destination: "/360-appraisals", statusCode: 301 },
    ];
  },
};

export default nextConfig;
