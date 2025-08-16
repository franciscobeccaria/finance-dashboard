import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Presus. - Gestión de Presupuestos Personales",
  description: "Controla tus finanzas personales con Presus. Gestiona presupuestos, registra gastos y visualiza tu progreso financiero en tiempo real.",
  keywords: ["presupuestos", "finanzas personales", "gastos", "control financiero", "dinero", "ahorro", "presus"],
  authors: [{ name: "Presus" }],
  creator: "Presus",
  publisher: "Presus",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
  openGraph: {
    title: "Presus. - Tu Control Financiero Personal",
    description: "Gestiona tus presupuestos y gastos de forma inteligente. Visualiza tu progreso financiero y toma control de tu dinero con Presus.",
    type: "website",
    locale: "es_AR",
    siteName: "Presus",
  },
  twitter: {
    card: "summary_large_image",
    title: "Presus. - Gestión de Presupuestos Personales",
    description: "Controla tus finanzas personales con Presus. Gestiona presupuestos, registra gastos y visualiza tu progreso financiero.",
    creator: "@presus",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon-192.svg", sizes: "192x192", type: "image/svg+xml" },
      { url: "/icon-512.svg", sizes: "512x512", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-touch-icon.svg", sizes: "180x180", type: "image/svg+xml" },
    ],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#1e40af",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-AR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
