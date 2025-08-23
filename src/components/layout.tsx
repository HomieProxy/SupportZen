
"use client";

import React, { useState, useEffect } from "react";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { MainNav } from "./main-nav";
import { UserNav } from "./user-nav";
import { Icons } from "./icons";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/use-auth";
import { usePathname, useRouter } from "next/navigation";
import LoginPage from "@/app/login/page";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  
  // By default, the sidebar is open on desktop and closed on mobile
  const defaultOpen = !isMobile;

  useEffect(() => {
    if (!loading && !user && pathname !== '/login') {
      router.push('/login');
    }
    if (!loading && user && pathname === '/login') {
        router.push('/');
    }
  }, [user, loading, pathname, router]);


  if (loading) {
    return <div className="flex h-screen w-screen items-center justify-center">Loading...</div>;
  }
  
  if (!user && pathname === '/login') {
    return <LoginPage />;
  }

  if (!user) {
    return null; 
  }

  return (
    <SidebarProvider open={open} onOpenChange={setOpen} defaultOpen={defaultOpen}>
      <Sidebar>
        <SidebarHeader>
          <span
            className={cn(
              "font-bold font-headline text-xl",
              "group-data-[state=collapsed]:hidden group-data-[collapsible=icon]:hidden"
            )}
          >
            Navigation
          </span>
        </SidebarHeader>
        <SidebarContent>
          <MainNav />
        </SidebarContent>
      </Sidebar>
      <SidebarInset className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 lg:h-[60px] lg:px-6 sticky top-0 z-30">
          <SidebarTrigger className="md:hidden" />
           <div className="w-full flex-1">
             <Link href="/" className="flex items-center gap-2">
                <Icons.logo className="w-8 h-8" />
                <span className="font-bold font-headline text-xl hidden md:inline-block">
                  SupportZen
                </span>
             </Link>
          </div>
          <UserNav />
        </header>
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
