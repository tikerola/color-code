import type { NextConfig } from "next";

const isStaticExport = process.env.STATIC_EXPORT === "true";

const nextConfig: NextConfig = {
  basePath: "/color-code",
  assetPrefix: "/color-code",
  ...(isStaticExport
    ? { output: "export" }
    : {
        async redirects() {
          return [
            { source: "/", destination: "/color-code", permanent: false, basePath: false },
          ];
        },
      }),
};

export default nextConfig;
