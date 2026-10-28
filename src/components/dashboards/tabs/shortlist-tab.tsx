"use client"

import { useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Heart, MapPin, ArrowUpRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { ROUTES } from "@/lib/routes"
import { useShortlistStore } from "@/lib/shortlist-store"
import { buildShortlistItems } from "@/lib/shortlist-items"

export function ShortlistTab() {
  const router = useRouter()
  const shortlistedIds = useShortlistStore((s) => s.shortlistedIds)
  const snapshots = useShortlistStore((s) => s.snapshots)
  const toggleShortlist = useShortlistStore((s) => s.toggleShortlist)
  const pending = useShortlistStore((s) => s.pending)

  // Pick up anything saved or removed on another device since sign-in.
  useEffect(() => {
    void useShortlistStore.getState().syncFromServer()
  }, [])

  const items = buildShortlistItems(shortlistedIds, snapshots)

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl font-bold text-brand-secondary">Shortlist</h2>
          <p className="text-sm text-brand-muted-foreground">
            {items.length} saved home{items.length === 1 ? "" : "s"} &amp; project{items.length === 1 ? "" : "s"}
          </p>
        </div>
        <button
          onClick={() => router.push(ROUTES.properties)}
          className="flex items-center gap-1 text-xs font-bold text-brand-primary-dark hover:text-brand-secondary"
        >
          Browse more <ArrowUpRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {items.length === 0 ? (
        <div className="card-sheen bg-card p-10 text-center text-sm text-brand-secondary/60">
          Nothing shortlisted yet — tap the heart on any property or project to save it here.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {items.map((item, i) => (
              <motion.div
                key={`${item.kind}-${item.id}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.05 }}
                className="card-sheen group relative overflow-hidden bg-card"
              >
                <button
                  onClick={() => router.push(item.href ?? ROUTES.properties)}
                  className="block w-full text-left"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img src={item.image} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-secondary/50 to-transparent" />
                    <div className="absolute bottom-3 left-3 font-serif text-lg font-bold text-white">{item.price}</div>
                  </div>
                  <div className="p-4">
                    <h3 className="truncate font-serif text-base font-bold text-brand-secondary">{item.title}</h3>
                    <div className="mt-1 flex items-center gap-1 text-xs text-brand-secondary/55">
                      <MapPin className="h-3 w-3 text-brand-primary-dark" /> {item.location}
                    </div>
                    <div className="mt-2 text-[11px] text-brand-secondary/65">{item.meta}</div>
                  </div>
                </button>
                <button
                  onClick={() => toggleShortlist(item.id)}
                  disabled={pending.includes(item.id)}
                  aria-label={`Remove ${item.title} from shortlist`}
                  className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-card/90 text-brand-primary-dark backdrop-blur-sm hover:bg-card"
                >
                  <Heart className="h-4 w-4 fill-brand-primary-dark" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
