'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Scan,
  PackageCheck,
  Truck,
  Activity,
  AlertTriangle,
  Users,
  MessageSquare,
  BarChart3,
  FileText,
  Settings,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Sparkles,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { store } from '@/lib/db/store';

interface SidebarProps {
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({ isMobileOpen, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const unreadAlerts = store.getAlerts().filter((a) => !a.isRead).length;

  const navItems = [
    {
      name: 'Overview',
      href: '/dashboard/overview',
      icon: LayoutDashboard,
    },
    {
      name: 'Orders',
      href: '/dashboard/orders',
      icon: ShoppingBag,
    },
    {
      name: 'Produce Catalog',
      href: '/dashboard/products',
      icon: Package,
    },
    {
      name: 'AI Inspection',
      href: '/dashboard/inspection',
      icon: Scan,
      badge: 'Gemini',
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    },
    {
      name: 'Smart Packing',
      href: '/dashboard/packing',
      icon: PackageCheck,
    },
    {
      name: 'Deliveries',
      href: '/dashboard/deliveries',
      icon: Truck,
    },
    {
      name: 'Virtual Telemetry',
      href: '/dashboard/telemetry',
      icon: Activity,
      badge: 'Live',
      badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    },
    {
      name: 'Alert Center',
      href: '/dashboard/alerts',
      icon: AlertTriangle,
      badge: unreadAlerts > 0 ? `${unreadAlerts}` : undefined,
      badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    },
    {
      name: 'Riders Fleet',
      href: '/dashboard/riders',
      icon: Users,
    },
    {
      name: 'Customer Feedback',
      href: '/dashboard/feedback',
      icon: MessageSquare,
    },
    {
      name: 'Analytics',
      href: '/dashboard/analytics',
      icon: BarChart3,
    },
    {
      name: 'Reports & Audit',
      href: '/dashboard/reports',
      icon: FileText,
    },
  ];

  const bottomItems = [
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
    },
    {
      name: 'Admin & System',
      href: '/admin',
      icon: ShieldAlert,
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full select-none">
      {/* Brand Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-white/5">
        <Link
          href="/dashboard/overview"
          onClick={onCloseMobile}
          className="flex items-center gap-3 group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-[1px] shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform flex-shrink-0">
            <div className="w-full h-full bg-[#0d1219] rounded-[11px] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                FRESHGUARD <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">AI</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Produce Intelligence</span>
            </div>
          )}
        </Link>

        {/* Mobile close button */}
        <button
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Navigation Links */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {!collapsed && (
          <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Operations Pipeline
          </div>
        )}
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              title={collapsed ? item.name : undefined}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all group relative',
                isActive
                  ? 'bg-gradient-to-r from-emerald-500/15 to-teal-500/10 text-emerald-300 border border-emerald-500/25 shadow-sm'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              )}
            >
              <item.icon
                className={cn(
                  'w-4 h-4 flex-shrink-0 transition-colors',
                  isActive ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-300'
                )}
              />
              {!collapsed && <span className="flex-1 truncate">{item.name}</span>}
              {!collapsed && item.badge && (
                <span
                  className={cn(
                    'text-[10px] px-1.5 py-0.2 rounded-full border font-mono font-semibold',
                    item.badgeColor
                  )}
                >
                  {item.badge}
                </span>
              )}
              {collapsed && item.badge && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-400" />
              )}
            </Link>
          );
        })}
      </div>

      {/* Bottom Controls: Settings, Admin, Collapse Toggle */}
      <div className="p-3 border-t border-white/5 space-y-1">
        {bottomItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              title={collapsed ? item.name : undefined}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all group',
                isActive
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              )}
            >
              <item.icon className="w-4 h-4 flex-shrink-0 text-slate-500 group-hover:text-slate-300" />
              {!collapsed && <span className="flex-1 truncate">{item.name}</span>}
            </Link>
          );
        })}

        {/* Collapse Toggle for Desktop */}
        <div className="hidden lg:block pt-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center p-2 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 transition-colors"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col flex-shrink-0 border-r border-white/5 bg-[#090d13]/95 backdrop-blur-xl transition-all duration-300 z-20',
          collapsed ? 'w-20' : 'w-64'
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 bg-[#090d13] border-r border-slate-800 h-full shadow-2xl z-10">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
