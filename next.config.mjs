import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  // In compressed (production) output, Sass prefixes any file containing non-ASCII characters with a BOM.
  // Once modules are concatenated into one chunk, that BOM sits mid-file and invalidates the module's first selector.
  sassOptions: {
    charset: false,
  },
  experimental: {
    serverActions: {
      allowedOrigins: [
        process.env.NEXT_PUBLIC_BASE_URL
      ],
    },
  },
  webpack: (config, { isServer }) => {
    // Prevent webpack from bundling Node.js modules for the browser during build time
    // '@dmptool/types' has conditional require() calls for 'fs' and 'path' that are only executed server-side,
    // but webpack sees them during static analysis and tries to bundle them for the client-side, causing build errors.
    if (!isServer) { // Only client-side build. 'fs' and 'path' doesn't work on client side anyway
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };
    }
    return config;
  },
};

export default withNextIntl(nextConfig);