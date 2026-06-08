import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/color-code",
  assetPrefix: "/color-code",
  async redirects() {
    return [
      {
        source: "/",
        destination: "/color-code",
        permanent: false,
        basePath: false,
      },
    ];
  },
};

export default nextConfig;
