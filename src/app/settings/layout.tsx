import { FreshGuardShell } from '@/components/freshguard-shell';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <FreshGuardShell>{children}</FreshGuardShell>;
}
