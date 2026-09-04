/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: '/vault/:path*',
        destination: '/api/vault/view?path=:path*',
      },
      {
        source: '/payments/:path*',
        destination: '/api/vault/view?bucket=payment-proofs-vault&path=:path*',
      },
    ];
  },
};

module.exports = nextConfig;
