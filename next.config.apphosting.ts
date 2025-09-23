import type {NextConfig} from 'next';

// Configuration for Firebase App Hosting (full Next.js features)
const nextConfig: NextConfig = {
  // No static export - use server-side rendering
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  typescript: {
    ignoreBuildErrors: true, // Ignore TS errors for now
  },
  eslint: {
    ignoreDuringBuilds: true, // Ignore ESLint for now
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
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
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;