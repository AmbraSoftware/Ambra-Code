"use client";

import { Sidebar } from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/layout/sidebar-nav';

export function SidebarWithToggle() {
  return (
    <Sidebar className="border-r flex flex-col" collapsible="icon">
      <SidebarNav />
    </Sidebar>
  );
}
