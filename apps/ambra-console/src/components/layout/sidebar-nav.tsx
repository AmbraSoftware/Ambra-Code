
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
  Banknote,
  LogOut,
  Building,
  Megaphone,
  Package,
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

const navItems = [
  { href: "/dashboard", icon: <LayoutDashboard />, label: "Visão Geral" },
  { href: "/dashboard/entities", icon: <Building />, label: "Entidades" },
  { href: "/dashboard/plans", icon: <Package />, label: "Planos" },
  { href: "/dashboard/users", icon: <Users />, label: "Usuários" },
  { href: "/dashboard/financial-audit", icon: <Banknote />, label: "Auditoria" },
  { href: "/dashboard/announcements", icon: <Megaphone />, label: "Anúncios" },
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
        <div className={cn(
          "flex items-center gap-2 p-2",
          state === 'collapsed' && "justify-center"
        )}>
          <h1 className={cn("text-xl font-semibold font-headline", state === 'collapsed' && "hidden")}>Ambra Console</h1>
        </div>
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
