"use client";
import Link from "next/link";
import { ChevronDown, UserRound } from "lucide-react";
import { useState } from "react";
import { useAppState } from "./AppProviders";

export default function ProfileMenu() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAppState();
  return <div className="menu-wrap"><button className="profile-trigger" onClick={() => setOpen((value) => !value)}><span className="avatar">KM</span><span className="profile-copy"><strong>{user.name}</strong><small>{user.employeeId} · {user.role}</small></span><ChevronDown size={16} /></button>{open && <div className="popover profile-popover"><Link href="/settings"><UserRound size={16} />My Profile</Link><Link href="/settings">Settings</Link><Link href="/help">Help</Link><button onClick={logout}>Logout</button></div>}</div>;
}
