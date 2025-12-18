import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "./providers/LanguageProvider";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
export const metadata: Metadata = {
  // 1. Título de la pestaña
  title: "Collector's Vault", 
  // Descripción para SEO (Buscadores)
  description: "Gestiona tu colección de cartas de Pokémon y más.",
  // 2. Iconos (Configuración completa para asegurar que cambie)
  icons: {
    icon: {
      url: '/icono.png',
      sizes: '32x32',
      type: 'image/png',
    },
    shortcut: '/icono.png',
    apple: {
      url: '/icono.png',
      sizes: '180x180',
      type: 'image/png',
    },
  },
  // 3. Imagen del buscador y redes sociales (Open Graph)
  openGraph: {
    title: "Collector's Vault",
    description: "Gestiona tu colección de cartas de Pokémon y más.",
    images: [
      {
        url: '/icono.png', // La imagen que se mostrará al compartir
        width: 400,
        height: 400,
        alt: "Logo de Collector's Vault",
      },
    ],
    type: 'website',
  },
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es"> 
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}