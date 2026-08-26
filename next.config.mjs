/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Submissions may be up to 10 MB; lift the default 1 MB Server Action cap.
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },
};

export default nextConfig;
