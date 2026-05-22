/** @type {import('next').NextConfig} */
const isAppBuild = process.env.BUILD_TARGET === 'app';

const nextConfig = {
  compiler: { styledComponents: true },
  devIndicators: false,
  ...(isAppBuild && {
    output: 'export',
    trailingSlash: true,
    images: { unoptimized: true },
  }),
};

module.exports = nextConfig;
