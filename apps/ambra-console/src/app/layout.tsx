
import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import React from 'react';
import { CensorshipProvider } from '@/contexts/censorship-context';


export const metadata: Metadata = {
  title: 'Ambra Console',
  description: 'Centro de comando privado do ecossistema Ambra.',
  icons: {
    icon: '/ambra-icon.svg',
    shortcut: '/ambra-icon.svg',
    apple: '/ambra-icon.svg',
  },
};

import { AuthProvider } from '@/contexts/auth-context';
import { Providers } from '@/components/providers';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="light" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Source+Code+Pro:wght@400;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={cn('font-body antialiased', 'min-h-screen bg-background')}>
        <Providers>
          <AuthProvider>
            <CensorshipProvider>
              {children}
            </CensorshipProvider>
          </AuthProvider>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
