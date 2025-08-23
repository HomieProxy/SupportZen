"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Home, Ticket, MessageSquare, Settings, ShieldQuestion } from "lucide-react";

const menuItems = [
  {
    href: "/",
    label: "Dashboard",
    icon: Home,
  },
  {
    href: "/tickets",
    label: "Tickets",
    icon: Ticket,
  },
  {
    href: "/chat",
    label: "Live Chat",
    icon: MessageSquare,
  },
    {
    href: "/logs",
    label: "System Logs",
    icon: ShieldQuestion,
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
  },
];

export function MainNav() {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {menuItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <SidebarMenuButton
            asChild
            isActive={pathname.startsWith(item.href) && (item.href === '/' ? pathname === '/' : true)}
            tooltip={item.label}
          >
            <Link href={item.href}>
              <item.icon />
              <span>{item.label}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
