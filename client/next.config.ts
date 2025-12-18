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
      const API_URL = process.env.API_URL || 'http://localhost:5000';
      return [
        {
          source: '/api/:path*',
          destination: `${API_URL}/api/:path*`,
        },
      ];
  },
};
//
export default nextConfig;