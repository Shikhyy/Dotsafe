import type { Metadata } from "next";
import { Syne, Space_Mono, Manrope } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "DotSafe — AI-Powered Wallet Risk Guard for Polkadot Hub",
  description:
    "Scan all your token approvals, get AI-powered risk scores via Gemini 2.0 Flash, and revoke dangerous permissions in one transaction. Built for Passet Hub with XCM cross-chain monitoring.",
  keywords: [
    "Polkadot",
    "Polkadot Hub",
    "Passet Hub",
    "Token Approvals",
    "Wallet Security",
    "AI Risk Scoring",
    "Gemini AI",
    "ERC-20",
    "Batch Revoke",
    "XCM",
    "Smart Contract",
    "DeFi Security",
  ],
  icons: {
    icon: "/icon.svg",
  },
  openGraph: {
    title: "DotSafe — AI-Powered Wallet Risk Guard",
    description:
      "Scan, score, and revoke risky token approvals on Polkadot Hub. Powered by Google Gemini 2.0 Flash AI.",
    type: "website",
    siteName: "DotSafe",
  },
  twitter: {
    card: "summary_large_image",
    title: "DotSafe — AI-Powered Wallet Risk Guard",
    description:
      "Scan, score, and revoke risky token approvals on Polkadot Hub. Powered by Gemini 2.0 Flash.",
  },
  other: {
    "theme-color": "#E8175D",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${syne.variable} ${spaceMono.variable} ${manrope.variable} antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
