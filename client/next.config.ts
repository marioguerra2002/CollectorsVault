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
        destination: 'http://localhost:5000/api/:path*', // Redirige al puerto 5000
      },
    ];
  },
};
//
export default nextConfig;