/** @type {import('next').NextConfig} */
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

const nextConfig = {
  reactStrictMode: true,

  serverExternalPackages: [
"@remotion/bundler",
"@remotion/renderer",
"@remotion/compositor-linux-x64-gnu",
],


  experimental: {
    serverComponentsExternalPackages: [
"@remotion/bundler",
"@remotion/renderer",
"@remotion/compositor-linux-x64-gnu",
],

    outputFileTracingIncludes: {
      "/api/render": [
        "./src/remotion/**/*",
        "./src/components/**/*",
        "./src/lib/**/*",
        "./src/types/**/*",
        "./node_modules/@remotion/compositor-linux-x64-gnu/**/*",
      ],
    },
  },
};

module.exports = withPWA(nextConfig);