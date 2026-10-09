'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Menu,
  Search,
  Bell,
  Sparkles,
  Command,
  Activity,
  Shield,
  ChevronDown,
  UserCheck,
  Radio,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { store } from '@/lib/db/store';
import { UserRole } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

interface HeaderProps {
  onToggleSidebar: () => void;
  onOpenCommand: () => void;
}

export function Header({ onToggleSidebar, onOpenCommand }: HeaderProps) {
  const { user, role, loginAsRole, logout } = useAuth();
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);

  const unreadAlerts = store.getAlerts().filter((a) => !a.isRead).length;

  const roles: { role: UserRole; label: string }[] = [
    { role: 'ADMIN', label: 'Admin Executive' },
    { role: 'QUALITY_INSPECTOR', label: 'Quality Inspector' },
    { role: 'PACKING_OPERATOR', label: 'Packing Operator' },
    { role: 'DELIVERY_MANAGER', label: 'Delivery Manager' },
    { role: 'VIEWER', label: 'Auditor / Viewer' },
  ];

  return (
    <header className="sticky top-0 z-30 h-16 glass-panel border-b border-white/5 px-4 sm:px-6 flex items-center justify-between gap-4">
      {/* Left: Mobile Toggle & Global Search Trigger */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Toggle navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <button
          onClick={onOpenCommand}
          className="hidden sm:flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 text-xs transition-all w-72 justify-between cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-emerald-400" />
            <span>Search orders, produce, alerts...</span>
          </div>
          <kbd className="text-[10px] font-mono bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-slate-400 flex items-center gap-0.5">
            <Command className="w-2.5 h-2.5" /> K
          </kbd>
        </button>
      </div>

      {/* Right: Telemetry Live Status, Alerts, Persona Switcher */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Real-Time Telemetry Live Indicator */}
        <Link
          href="/dashboard/telemetry"
          className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono hover:bg-cyan-500/15 transition-colors"
        >
          <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>IoT Physics Live</span>
        </Link>

        {/* Alert Center Link with unread count */}
        <Link
          href="/dashboard/alerts"
          className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <Bell className="w-4 h-4" />
          {unreadAlerts > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          )}
          {unreadAlerts > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
          )}
        </Link>

        {/* User Role & Persona Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowPersonaMenu(!showPersonaMenu)}
            className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 transition-all text-left"
          >
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-7 h-7 rounded-lg object-cover border border-emerald-500/30"
              />
            ) : (
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-xs font-bold">
                {user?.name?.charAt(0) || 'U'}
              </div>
            )}
            <div className="hidden sm:block text-left">
              <div className="text-xs font-medium text-white line-clamp-1 leading-tight">
                {user?.name || 'Authorized User'}
              </div>
              <div className="text-[10px] text-emerald-400 font-mono leading-none mt-0.5">
                {role}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          </button>

          {/* Persona Menu Popover */}
          {showPersonaMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowPersonaMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-64 glass-card rounded-2xl border border-white/10 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2 border-b border-slate-800">
                  <div className="text-xs font-semibold text-white">{user?.name}</div>
                  <div className="text-[11px] text-slate-400">{user?.email}</div>
                  <div className="mt-1">
                    <Badge variant="emerald" dot>
                      Active: {role}
                    </Badge>
                  </div>
                </div>

                <div className="py-2">
                  <div className="text-[10px] uppercase font-semibold text-slate-500 px-3 py-1 flex items-center gap-1.5">
                    <UserCheck className="w-3 h-3 text-emerald-400" /> Switch Operational Role
                  </div>
                  {roles.map((r) => (
                    <button
                      key={r.role}
                      onClick={() => {
                        loginAsRole(r.role);
                        setShowPersonaMenu(false);
                      }}
                      className="w-full text-left px-3 py-1.5 rounded-lg text-xs hover:bg-slate-800/80 text-slate-300 hover:text-white flex items-center justify-between transition-colors"
                    >
                      <span>{r.label}</span>
                      {role === r.role && <span className="text-emerald-400 text-[10px]">●</span>}
                    </button>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-800">
                  <Link
                    href="/settings/profile"
                    onClick={() => setShowPersonaMenu(false)}
                    className="block px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800/60"
                  >
                    User Profile & Preferences
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setShowPersonaMenu(false);
                      window.location.href = '/login';
                    }}
                    className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
