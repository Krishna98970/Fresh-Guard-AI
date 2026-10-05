"use client";
import { createContext, useContext, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import { demoUser } from "@/lib/mockData";
import type { Inspection, User } from "@/lib/types";

type AppState = { user: User; inspections: Inspection[]; addInspection: (inspection: Inspection) => void; logout: () => void };
const StateContext = createContext<AppState | null>(null);

export function AppProviders({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User>(demoUser);
  const [savedInspections, setSavedInspections] = useState<Inspection[]>([]);
  const hydrated = useSyncExternalStore(() => () => {}, () => true, () => false);
  useEffect(() => { if (pathname !== "/login" && localStorage.getItem("freshguard-auth") !== "true") router.replace("/login"); }, [pathname, router]);
  const value = useMemo(() => ({ user, inspections: savedInspections, addInspection: (inspection: Inspection) => setSavedInspections((items) => [inspection, ...items]), logout: () => { localStorage.removeItem("freshguard-auth"); setUser(demoUser); router.replace("/login"); } }), [router, savedInspections, user]);
  if (!hydrated || (pathname !== "/login" && typeof window !== "undefined" && localStorage.getItem("freshguard-auth") !== "true")) return pathname === "/login" ? <>{children}</> : null;
  return <StateContext.Provider value={value}>{children}</StateContext.Provider>;
}

export function useAppState() { const context = useContext(StateContext); if (!context) throw new Error("useAppState must be used inside AppProviders"); return context; }
