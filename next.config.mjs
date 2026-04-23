/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        // Matches any S3 bucket: <bucket>.s3.<region>.amazonaws.com
        hostname: "**.amazonaws.com",
      },
    ],
  },
};

export default nextConfig;
