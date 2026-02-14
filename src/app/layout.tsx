import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { JobSelectionProvider } from "@/contexts/JobSelectionContext";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Rizq.AI - Find Your Dream Job",
  description: "AI-powered job search platform to find and apply to jobs faster",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <JobSelectionProvider>
            {children}
            <Toaster 
              position="top-right" 
              richColors 
              offset={80}
            />
          </JobSelectionProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
