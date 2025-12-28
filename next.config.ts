import type { NextConfig } from "next";

// Cargar variables de entorno
require('dotenv').config();

const nextConfig: NextConfig = {
  // Configuración básica de imágenes
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.weroad.io',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'strapi-imaginary.weroad.it',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'gibravo.it',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'assets.voxcity.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'content-historia.nationalgeographic.com.es',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '1000sitiosquever.com',
        port: '',
        pathname: '/**',
      },
    ],
  },

  // Configuración de webpack simplificada
  webpack: (config) => {
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });
    return config;
  },

  // Deshabilitar ESLint durante el build
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Headers de seguridad básicos
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
      // Headers especiales para el template (NO cachear)
      {
        source: '/templates/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, max-age=0',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
