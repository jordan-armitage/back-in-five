/** @type {import('next').NextConfig} */
const repo = "back-in-five";
const isProd = process.env.NODE_ENV === "production";

const nextConfig = {
  reactStrictMode: true,
  output: "export",
  basePath: isProd ? "/" + repo : "",
  assetPrefix: isProd ? "/" + repo + "/" : "",
  trailingSlash: true
};

module.exports = nextConfig;
