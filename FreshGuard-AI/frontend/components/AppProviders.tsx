"use client";

import { createContext, useContext, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import { demoUser } from "@/lib/mockData";
import type { User } from "@/lib/types";

type AppState = { user: User; setUser: (user: User) => void; logout: () => void };
const StateContext = createContext<AppState | null>(null);

let cachedUserStorage: string | null | undefined;
let cachedUser = demoUser;

function getStoredUser(): User {
  const stored = localStorage.getItem("freshguard-user");
  if (stored === cachedUserStorage) return cachedUser;
  cachedUserStorage = stored;
  if (!stored) {
    cachedUser = demoUser;
    return cachedUser;
  }
  try {
    const value: unknown = JSON.parse(stored);
    if (
      typeof value === "object"
      && value !== null
      && "name" in value
      && typeof value.name === "string"
      && "employeeId" in value
      && typeof value.employeeId === "string"
      && "role" in value
      && typeof value.role === "string"
      && "warehouseId" in value
      && typeof value.warehouseId === "string"
    ) {
      cachedUser = {
        name: value.name,
        employeeId: value.employeeId,
        role: value.role,
        warehouseId: value.warehouseId,
      };
    }
    else cachedUser = demoUser;
  } catch {
    cachedUser = demoUser;
  }
  return cachedUser;
}

function subscribeToUser(onChange: () => void) {
  window.addEventListener("freshguard-user-change", onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener("freshguard-user-change", onChange);
    window.removeEventListener("storage", onChange);
  };
}

function storeUser(user: User) {
  cachedUser = user;
  cachedUserStorage = JSON.stringify(user);
  localStorage.setItem("freshguard-user", cachedUserStorage);
  window.dispatchEvent(new Event("freshguard-user-change"));
}

function hasBackendSession() {
  return localStorage.getItem("freshguard-auth") === "true"
    && localStorage.getItem("freshguard-access-token") !== null;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useSyncExternalStore(subscribeToUser, getStoredUser, () => demoUser);
  const hydrated = useSyncExternalStore(() => () => {}, () => true, () => false);

  useEffect(() => {
    if (pathname !== "/login" && !hasBackendSession()) {
      router.replace("/login");
    }
  }, [pathname, router]);

  const value = useMemo(() => ({
    user,
    setUser: storeUser,
    logout: () => {
      localStorage.removeItem("freshguard-auth");
      localStorage.removeItem("freshguard-access-token");
      localStorage.removeItem("freshguard-user");
      cachedUser = demoUser;
      cachedUserStorage = null;
      window.dispatchEvent(new Event("freshguard-user-change"));
      router.replace("/login");
    },
  }), [router, user]);

  const shouldRenderChildren = hydrated
    && (pathname === "/login" || typeof window === "undefined" || hasBackendSession());

  return (
    <StateContext.Provider value={value}>
      {shouldRenderChildren || pathname === "/login" ? children : null}
    </StateContext.Provider>
  );
}

<<<<<<< HEAD
export function useAppState() { const context = useContext(StateContext); if (!context) throw new Error("useAppState must be used inside AppProviders"); return context; }


=======
export function useAppState() {
  const context = useContext(StateContext);
  if (!context) throw new Error("useAppState must be used inside AppProviders");
  return context;
}
>>>>>>> f1596003 (Update FreshGuard AI)
