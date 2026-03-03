
"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarHeader,
  SidebarContent,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Users,
  Shield,
  LogOut,
  Building,
  Megaphone,
  DollarSign,
  Trash2,
} from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import React from "react";
import { ClientOnly } from "../client-only";
import Image from "next/image";

const navItems = [
  { href: "/dashboard", icon: <LayoutDashboard />, label: "Visão Geral" },
  { href: "/dashboard/entities", icon: <Building />, label: "Entidades" },
  { href: "/dashboard/users", icon: <Users />, label: "Usuários" },
  { href: "/dashboard/commercial", icon: <DollarSign />, label: "Comercial" },
  { href: "/dashboard/announcements", icon: <Megaphone />, label: "Anúncios" },
  { href: "/dashboard/audit", icon: <Shield />, label: "Auditoria" },
  { href: "/dashboard/trash", icon: <Trash2 />, label: "Lixeira" },
];

export function SidebarNav() {
  const pathname = usePathname();
  const { state } = useSidebar();
  const router = useRouter();
  const { user } = useAuth();

  const handleLogout = () => {
    router.push('/');
  }

  return (
    <>
      <SidebarHeader>
        <Link href="/dashboard" className={cn(
          "flex items-center gap-2 p-2 hover:opacity-90 transition-opacity",
          state === 'collapsed' && "justify-center"
        )}>
          <div className={cn("relative flex items-center h-8", state !== 'collapsed' && "hidden")}>
            <div className="text-xl font-black text-brand-primary">A</div>
          </div>
          <div className={cn("relative flex items-center h-10", state === 'collapsed' && "hidden")}>
            <div className="text-2xl font-black tracking-tighter text-brand-primary leading-none">
              AMBRA<span className="text-text-primary dark:text-white font-light text-xl ml-0.5">CONSOLE</span>
            </div>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent className="p-2 flex-1">
        <SidebarGroup>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  tooltip={item.label}
                >
                  <Link href={item.href}>
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <div className="p-2">
        <div className={cn("flex flex-col", state === 'collapsed' && "hidden")}>
          <span className="text-sm font-medium text-foreground">{user?.name || '---'}</span>
          <span className="text-xs text-muted-foreground">{user?.email || '---'}</span>
        </div>
        <ClientOnly>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="ml-auto">
                <LogOut className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação irá desconectar você da sua conta e será necessário fazer login novamente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleLogout}>Confirmar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </ClientOnly>
      </div>
    </>
  );
}
