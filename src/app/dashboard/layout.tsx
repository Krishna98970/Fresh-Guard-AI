'use client';

import React from 'react';
import { FreshGuardShell } from '@/components/freshguard-shell';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <FreshGuardShell>{children}</FreshGuardShell>;
}
