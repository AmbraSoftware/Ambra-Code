import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Ambra Food - Alimentação Escolar',
  description: 'Alimentação escolar saudável, prática e segura',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Ambra Food',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1, // Previne zoom no iOS
  userScalable: false,
  viewportFit: 'cover', // Safe area iOS
  themeColor: '#FC5407',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className="overscroll-none">
        <div className="app-container">
          {children}
        </div>
      </body>
    </html>
  );
}
