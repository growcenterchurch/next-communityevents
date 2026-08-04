/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
      },
      {
        protocol: "https",
        hostname: "static.wixstatic.com",
        port: "",
      },
      {
        protocol: "https",
        hostname: "growcommunity.church",
        port: "",
      },
      //i.imgur.com
      {
        protocol: "https",
        hostname: "i.imgur.com",
        port: "",
      },
      {
        protocol: "https",
        hostname: "utfs.io",
        port: "",
      },
      {
        protocol: "https",
        hostname: "placehold.co",
        port: "",
      },
      {
        protocol: "https",
        hostname: "12y8645s4c.ufs.sh",
        port: "",
      },
      {
        protocol: "https",
        hostname: "ybmq92bflj.ufs.sh",
        port: "",
      },
    ],
  },
};

export default nextConfig;
