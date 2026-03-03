import type { Metadata, Viewport } from "next";
import { Instrument_Sans, Inter } from "next/font/google";
import "./globals.css";

import { Web3Provider } from "@/components/web3-provider";
import { AuthProvider } from "@/lib/auth-context";
import { AppHeroUIProvider } from "@/components/heroui-provider";
import { ToastProvider } from "@/components/toast-provider";
import { StructuredData } from "@/components/structured-data";

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MediChainAI - Privacy-First Medical AI",
  description: "Secure, federated medical imaging analysis powered by blockchain and AI",
  keywords: ["medical AI", "federated learning", "blockchain", "DICOM", "CT scan"],
  openGraph: {
    title: "MediChainAI - Privacy-First Medical AI",
    description: "Secure, federated medical imaging analysis",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "MediChainAI",
    description: "Privacy-First Medical AI with Blockchain",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f9fb" },
    { media: "(prefers-color-scheme: dark)", color: "#111417" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${instrumentSans.variable} ${inter.variable} font-primary antialiased`}>
        <StructuredData />
        <ToastProvider />
        <AppHeroUIProvider>
          <Web3Provider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </Web3Provider>
        </AppHeroUIProvider>
      </body>
    </html>
  );
}
