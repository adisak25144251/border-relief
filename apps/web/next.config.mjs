/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  basePath: process.env.NODE_ENV === "production" ? "/border-relief" : "",
  images: { unoptimized: true },
};

export default nextConfig;
