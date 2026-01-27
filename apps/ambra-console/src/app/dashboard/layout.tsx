import type { Metadata } from 'next';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Header } from '@/components/layout/header';
import { SidebarWithToggle } from '@/components/layout/sidebar';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import React from 'react';

export const metadata: Metadata = {
  title: 'Ambra Console | Dashboard',
  description: 'Centro de comando para operações Ambra.',
};

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ErrorBoundary>
      <SidebarProvider>
        <div className="flex min-h-screen">
          <SidebarWithToggle />
          <SidebarInset className="min-w-0 flex-1 w-full">
            <Header />
            <main className="p-4 sm:p-6 lg:p-8">{children}</main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </ErrorBoundary>
  );
}
