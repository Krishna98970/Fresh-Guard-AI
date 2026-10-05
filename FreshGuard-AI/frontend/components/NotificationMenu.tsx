"use client";
import { Bell, Check } from "lucide-react";
import { useState } from "react";
import { notifications } from "@/lib/mockData";

export default function NotificationMenu() {
  const [open, setOpen] = useState(false);
  return <div className="menu-wrap"><button className="icon-button" aria-label="Notifications" onClick={() => setOpen((value) => !value)}><Bell size={19} /><span className="notification-dot" /></button>{open && <div className="popover notification-popover"><div className="popover-heading"><strong>Notifications</strong><span>3 new</span></div>{notifications.map((notification) => <div className="notification-row" key={notification.title}><span className="notification-icon"><Check size={14} /></span><div><strong>{notification.title}</strong><p>{notification.detail}</p><small>{notification.time}</small></div></div>)}</div>}</div>;
}
