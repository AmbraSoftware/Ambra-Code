import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";
import Providers from "@/components/providers";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ambra Flow - Gestão de Cantina",
  description: "Sistema de Gestão de Cantina e Frente de Caixa",
  icons: {
    icon: '/ambra-icon.svg',
    shortcut: '/ambra-icon.svg',
    apple: '/ambra-icon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${manrope.variable} light`} suppressHydrationWarning>
      <head>
        {/* Fallback for legacy icons until full migration */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <Providers>
            {children}
            <Toaster position="top-right" richColors />
        </Providers>
      </body>
    </html>
  );
}
