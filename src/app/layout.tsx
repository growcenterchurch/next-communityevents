import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import MobileBottomNav from "@/components/MobileBottomNav";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { Analytics } from "@vercel/analytics/next";

const inter = Inter({ subsets: ["latin"] });

// Define other metadata
export const metadata: Metadata = {
  title: "Grow App",
  description: "Welcome to Grow Community's web app!",
  appleWebApp: {
    capable: true,
    title: "Grow App",
    statusBarStyle: "black-translucent",
  },
};

// Define viewport metadata separately
export const generateViewport = () => {
  return "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no";
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <AuthProvider>
        <body className={`${inter.className}`}>
          <Toaster />
          {children}
          <MobileBottomNav />
          <Analytics />
        </body>
      </AuthProvider>
    </html>
  );
}
