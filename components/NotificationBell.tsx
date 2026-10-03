"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { api, type Notification } from "@/lib/api";

export function NotificationBell() {
  const { token } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!token) return;
    api.listNotifications(token).then(r => {
      setNotifications(r.notifications ?? []);
      setUnread(r.unread_count ?? 0);
    }).catch(() => {});
  }, [token]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleOpen = async () => {
    setOpen(o => !o);
    if (!open && unread > 0 && token) {
      await api.markAllRead(token).catch(() => {});
      setUnread(0);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleOpen}
        className="relative w-9 h-9 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-[#8e8e93] hover:text-white transition-all duration-200"
      >
        <Bell size={16} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#0a84ff] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 top-12 w-80 bg-[#1c1c1e] border border-white/10 rounded-[20px] overflow-hidden z-50 shadow-2xl"
          >
            <div className="p-4 border-b border-white/[0.06]">
              <p className="text-sm font-semibold text-white">Notificaciones</p>
            </div>
            <div className="max-h-72 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-[#48484a] text-sm">Sin notificaciones</div>
              ) : (
                notifications.map(n => (
                  <div
                    key={n.id}
                    className={`px-4 py-3 border-b border-white/[0.04] last:border-0 ${!n.read ? "bg-[#0a84ff]/5" : ""}`}
                  >
                    {!n.read && (
                      <div className="w-1.5 h-1.5 rounded-full bg-[#0a84ff] inline-block mr-2 mb-0.5" />
                    )}
                    <p className="text-sm text-white leading-snug">{n.message}</p>
                    <p className="text-xs text-[#48484a] mt-0.5">
                      {new Date(n.created_at).toLocaleDateString("es", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
