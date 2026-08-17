"use client"

import { motion } from "framer-motion"
import { Bell, CheckCheck } from "lucide-react"
import { useNotificationsStore } from "@/lib/notifications-store"

export function NotificationsTab() {
  const notifications = useNotificationsStore((s) => s.notifications)
  const markRead = useNotificationsStore((s) => s.markRead)
  const markAllRead = useNotificationsStore((s) => s.markAllRead)
  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl font-bold text-brand-secondary">Notifications</h2>
          <p className="text-sm text-brand-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 text-xs font-bold text-brand-primary-dark hover:text-brand-secondary"
          >
            <CheckCheck className="h-3.5 w-3.5" /> Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="card-sheen bg-card p-10 text-center text-sm text-brand-secondary/60">
          Nothing here yet.
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n, i) => (
            <motion.button
              key={n.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => markRead(n.id)}
              className={
                "flex w-full items-start gap-3 border bg-card p-4 text-left transition-colors " +
                (n.read ? "border-brand-border opacity-70" : "border-brand-primary/40 hover:bg-brand-tertiary/40")
              }
            >
              <div className={"mt-0.5 h-2 w-2 shrink-0 rounded-full " + (n.read ? "bg-brand-secondary/30" : "bg-brand-primary")} />
              <div className="flex-1">
                <div className="text-sm font-bold text-brand-secondary">{n.title}</div>
                <div className="text-xs text-brand-secondary/65">{n.body}</div>
                <div className="mt-1 text-[10px] text-brand-secondary/45">{n.time}</div>
              </div>
              {!n.read && <span className="shrink-0 text-[10px] font-bold text-brand-primary-dark">Mark read</span>}
            </motion.button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3 border border-brand-primary/30 bg-brand-tertiary p-4 text-xs text-brand-secondary/70">
        <Bell className="h-4 w-4 text-brand-primary-dark" />
        <div>In-app notifications only — no email or SMS delivery is simulated in this prototype.</div>
      </div>
    </div>
  )
}
