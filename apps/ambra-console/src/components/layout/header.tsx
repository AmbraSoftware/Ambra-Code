
"use client";

import { Input } from "@/components/ui/input";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { Search, Bell, UserPlus, DollarSign, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "../ui/sheet";

import { Avatar, AvatarFallback } from "../ui/avatar";
import { useCensorship } from "@/contexts/censorship-context";

import { useNotifications } from "@/hooks/use-notifications";
import { CommandMenu } from "@/components/command-menu";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";


export function Header() {
  const { isMobile } = useSidebar();
  const { isCensored, toggleCensorship } = useCensorship();
  const { notifications, unreadCount, markAsRead, myActions, systemAlerts } = useNotifications();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      {isMobile && <SidebarTrigger />}
      <CommandMenu />
      <div className="flex items-center gap-4 md:ml-auto">
        <Button variant="ghost" size="icon" onClick={toggleCensorship} title={isCensored ? "Mostrar dados sensíveis" : "Ocultar dados sensíveis"}>
          {isCensored ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          <span className="sr-only">{isCensored ? "Mostrar dados sensíveis" : "Ocultar dados sensíveis"}</span>
        </Button>
        <div className="flex items-center gap-2">
          <div className="relative h-2 w-2">
            <div className={cn("absolute h-2 w-2 rounded-full bg-primary")}></div>
            <div className={cn("absolute h-2 w-2 animate-ping rounded-full bg-primary")}></div>
          </div>
          <span className="text-sm text-muted-foreground hidden md:inline">System Latency: <span className="text-foreground font-medium font-code">12ms</span></span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative h-2 w-2">
            <div className={cn("absolute h-2 w-2 rounded-full bg-primary")}></div>
          </div>
          <span className="text-sm text-muted-foreground hidden md:inline">Gateway: <span className="text-foreground font-medium">Connected</span></span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-600 animate-pulse ring-2 ring-background" />
              )}
              <span className="sr-only">Toggle notifications</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notificações</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <ScrollArea className="h-80">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Nenhuma notificação recente
                </div>
              ) : (
                <>
                  {systemAlerts && systemAlerts.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">
                        Alertas do Sistema
                      </div>
                      {systemAlerts.map((item) => (
                        <DropdownMenuItem key={item.id} className="cursor-pointer flex flex-col items-start gap-1 p-3">
                          <div className="flex w-full items-center justify-between">
                            <span className="font-medium text-sm">{item.title}</span>
                            <span className="text-xs text-muted-foreground">{item.time}</span>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {item.description}
                          </p>
                        </DropdownMenuItem>
                      ))}
                    </>
                  )}

                  {myActions && myActions.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 mt-2">
                        Minhas Ações
                      </div>
                      {myActions.map((item) => (
                        <DropdownMenuItem key={item.id} className="cursor-pointer flex flex-col items-start gap-1 p-3">
                          <div className="flex w-full items-center justify-between">
                            <span className="font-medium text-sm">{item.title}</span>
                            <span className="text-xs text-muted-foreground">{item.time}</span>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {item.description}
                          </p>
                        </DropdownMenuItem>
                      ))}
                    </>
                  )}
                </>
              )}
            </ScrollArea>
            <div className="p-2 border-t text-center">
              <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => markAsRead()}>
                Marcar todas como lidas
              </Button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

      </div>
    </header >
  );
}
