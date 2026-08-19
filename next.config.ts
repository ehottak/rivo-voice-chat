import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow tunneling services (localtunnel, ngrok, cloudflare) in development
  allowedDevOrigins: [
    '*.loca.lt',
    '*.ngrok-free.app',
    '*.ngrok.app',
    '*.ngrok.io',
    '*.trycloudflare.com',
    'localhost:3000',
  ],
};

export default nextConfig;
