import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "@/components/AppProviders";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "FreshGuard AI",
  description: "AI-assisted produce freshness inspection.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AppProviders>
          <AppShell>{children}</AppShell>
        </AppProviders>
      </body>
    </html>
  );
}
