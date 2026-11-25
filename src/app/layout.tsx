import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { RegisterSW } from "@/components/pwa/register-sw";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "El Ahorcado - Juego para niños",
  description:
    "Juego del ahorcado en español con 50 palabras pensadas para niños de 8 a 10 años. Divertido, colorido y fácil de jugar.",
  keywords: ["ahorcado", "hangman", "juego para niños", "español", "palabras", "educativo"],
  authors: [{ name: "Z.ai" }],
  // El manifiesto lo genera Next.js automáticamente desde app/manifest.ts.
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    shortcut: ["/icon-192.png"],
  },
  appleWebApp: {
    capable: true,
    title: "Ahorcado",
    statusBarStyle: "default",
  },
  openGraph: {
    title: "El Ahorcado - Juego para niños",
    description: "Adivina la palabra secreta antes de quedarte sin intentos.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#ea580c",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <RegisterSW />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
