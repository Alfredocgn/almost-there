import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Analytics } from "@vercel/analytics/next";
import { MiniKitProvider } from "@/components/minikit-provider";
import "./globals.css";
import { Pixelify_Sans } from "next/font/google";

export const metadata: Metadata = {
  title: "Treasure Hunt - Base Mini App",
  description: "A multiplayer treasure hunting game on Base",
  generator: "Base Mini App",
  openGraph: {
    title: "Treasure Hunt - Base Mini App",
    description: "A multiplayer treasure hunting game on Base",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Treasure Hunt - Base Mini App",
    description: "A multiplayer treasure hunting game on Base",
  },
};
const pixelifySans = Pixelify_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"], // Ajusta los pesos que necesites
  variable: "--font-pixelify-sans",
});
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${pixelifySans.variable}`}>
      <body
        className={`font-sans ${GeistSans.variable} ${GeistMono.variable} ${pixelifySans.className}`}
      >
        <MiniKitProvider>{children}</MiniKitProvider>
        <Analytics />
      </body>
    </html>
  );
}
