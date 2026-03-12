/** @type {import('next').NextConfig} */
const nextConfig = {
  // Terser mangling for Capacitor builds (PRD §23.10)
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization.minimize = true;
    }
    return config;
  },

  // Security headers (PRD §23.4)
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(self), geolocation=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },

  // Force HTTPS redirect
  async redirects() {
    return [];
  },

  images: {
    domains: [
      process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', '') ?? '',
    ],
  },

  // Relative paths only in client bundle (PRD §23.10)
  env: {
    NEXT_PUBLIC_APP_VERSION: '1.0.0-beta',
  },
};

module.exports = nextConfig;
