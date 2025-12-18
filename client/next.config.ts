import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  /* Opciones de configuración aquí */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.pokemontcg.io', 
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'assets.tcgdex.net', 
        port: '',
        pathname: '/**',
      },
    ],
  },
    async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`,
      },
    ];
  },
};
//
export default nextConfig;