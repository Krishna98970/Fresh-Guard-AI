"use client";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import ProfileMenu from "./ProfileMenu";
import NotificationMenu from "./NotificationMenu";
import { Menu, Search } from "lucide-react";
import { useState } from "react";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  if (pathname === "/login") return <>{children}</>;
  return <div className="app-shell"><Sidebar mobileOpen={mobileOpen} closeMobile={() => setMobileOpen(false)} /><div className="workspace"><header className="topbar"><button className="mobile-menu icon-button" aria-label="Open navigation" onClick={() => setMobileOpen(true)}><Menu size={20} /></button><div className="global-search"><Search size={17} /><input placeholder="Search inspections, batches, products..." aria-label="Global search" /></div><div className="topbar-actions"><NotificationMenu /><ProfileMenu /></div></header><div className="page-content">{children}</div></div></div>;
}
