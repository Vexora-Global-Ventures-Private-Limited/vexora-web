"use client"

import { motion } from "framer-motion"
import {
  Heart, Send, Bell, Phone, ArrowUpRight, ChevronRight, Crown, MapPin,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useNav } from "@/lib/nav-store"
import { ROUTES } from "@/lib/routes"
import { useContactStore, leadsForAccount, FREE_CONTACT_LIMIT, CHANNEL_LABEL } from "@/lib/contact-store"
import { useShortlistStore } from "@/lib/shortlist-store"
import { useProjectsStore } from "@/lib/projects-store"
import { buildShortlistItems } from "@/lib/shortlist-items"
import { useGetQuotaQuery } from "@/store/api/usersApi"
import { useGetUnreadCountQuery } from "@/store/api/notificationsApi"
import { AnimatedCounter } from "@/components/motion/animated-counter"

export function FreeDashboard() {
  const { user } = useNav()
  const router = useRouter()
  // Leads this buyer sent via POST /leads (the API has no "my enquiries" list yet).
  const allApiLeads = useContactStore((s) => s.apiLeads)
  const apiLeads = leadsForAccount(allApiLeads, user?.id)
  // GET /users/me/quota, fetched fresh every time (it changes on every
  // contact). Shown as "—" until it arrives — never a guessed number.
  const { data: quota, isError: quotaError } = useGetQuotaQuery(undefined, { skip: !user?.id, refetchOnMountOrArgChange: true })
  const contactLimit = quota?.limit ?? FREE_CONTACT_LIMIT
  const remaining = quota?.remaining ?? null
  const shortlistedIds = useShortlistStore((s) => s.shortlistedIds)
  const snapshots = useShortlistStore((s) => s.snapshots)
  const allProjects = useProjectsStore((s) => s.projects)
  const { data: unreadCount = 0 } = useGetUnreadCountQuery(undefined, { skip: !user?.id })

  const myEnquiries = apiLeads.slice(0, 5)
  const shortlisted = buildShortlistItems(shortlistedIds, snapshots, allProjects)

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="bg-gradient-to-br from-brand-primary/15 via-brand-tertiary to-white p-6 ring-1 ring-brand-primary/30">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-brand-primary-dark" />
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-primary-dark">Free Member</span>
            </div>
            <h2 className="mt-2 font-serif text-2xl font-bold text-brand-secondary">
              Welcome back, {user?.name.split(" ")[0] ?? "there"} 👋
            </h2>
            <p className="mt-1 text-sm text-brand-secondary/65">
              You have <b className="text-brand-primary-dark">{shortlisted.length} shortlisted</b> home{shortlisted.length === 1 ? "" : "s"}
              {remaining !== null && (
                <>
                  {" "}and <b className="text-brand-primary-dark">{remaining} free contact{remaining === 1 ? "" : "s"}</b> left
                </>
              )}
              .
            </p>
          </div>
          <button
            onClick={() => router.push(ROUTES.membership)}
            className="hidden bg-ink-black px-4 py-2.5 text-xs font-bold text-brand-primary sm:block"
          >
            Become a partner
          </button>
        </div>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label={quotaError ? "Free Contacts Left (couldn't load)" : "Free Contacts Left"}
          value={remaining}
          suffix={`/${contactLimit}`}
          icon={Phone}
        />
        <StatCard label="Enquiries Sent" value={apiLeads.length} icon={Send} />
        <StatCard label="Shortlisted" value={shortlisted.length} icon={Heart} />
        <StatCard label="Unread Notifications" value={unreadCount} icon={Bell} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Recent enquiries */}
        <div className="bg-card p-6 ring-1 ring-brand-border">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif text-lg font-bold text-brand-secondary">Your Enquiries</h3>
              <p className="text-xs text-brand-secondary/55">Every contact request you&apos;ve sent — owners reply directly</p>
            </div>
            <button
              onClick={() => router.push(ROUTES.properties)}
              className="flex items-center gap-1 text-xs font-bold text-brand-primary-dark hover:text-brand-secondary"
            >
              Browse <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>
          <div className="mt-4 space-y-2">
            {myEnquiries.length === 0 && (
              <div className="border border-dashed border-brand-border p-6 text-center text-xs text-brand-secondary/50">
                No enquiries yet — browse listings and contact an owner to get started.
              </div>
            )}
            {myEnquiries.map((lead) => {
              return (
                <motion.button
                  key={lead.leadId}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={() => router.push(ROUTES.propertyDetail(lead.slug))}
                  className="flex w-full items-center justify-between border border-brand-border bg-card p-3 text-left hover:border-brand-primary/40"
                >
                  <div className="min-w-0">
                    <div className="truncate text-xs font-bold text-brand-secondary">{lead.title}</div>
                    <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-brand-secondary/55">
                      <MapPin className="h-3 w-3 text-brand-primary-dark" /> {lead.location}
                    </div>
                    {/* Never surface delivered/undelivered to the buyer — identical copy either way. */}
                    <div className="mt-1 text-[10px] text-brand-secondary/45">{CHANNEL_LABEL[lead.channel]} · Sent</div>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-brand-secondary/40" />
                </motion.button>
              )
            })}
          </div>
        </div>

        {/* Shortlist */}
        <div className="bg-card p-6 ring-1 ring-brand-border">
          <h3 className="font-serif text-lg font-bold text-brand-secondary">Shortlisted</h3>
          <p className="text-xs text-brand-secondary/55">Saved homes &amp; projects you&apos;re considering</p>
          <div className="mt-4 space-y-3">
            {shortlisted.length === 0 && (
              <p className="text-xs text-brand-secondary/50">Nothing shortlisted yet — tap the heart on any property or project to save it here.</p>
            )}
            {shortlisted.map((item) => (
              <button
                key={`${item.kind}-${item.id}`}
                onClick={() => router.push(item.href ?? ROUTES.dashboardTab("shortlist"))}
                className="group flex w-full items-center gap-3 border border-brand-border bg-brand-tertiary/40 p-3 text-left hover:border-brand-primary/40"
              >
                <div className="relative h-14 w-14 shrink-0 overflow-hidden">
                  <img src={item.image} alt="" loading="lazy" className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-bold text-brand-secondary">{item.title}</div>
                  <div className="truncate text-[11px] text-brand-secondary/55">{item.price}</div>
                </div>
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-brand-secondary/40" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Upsell banner */}
      <div className="flex flex-col items-start justify-between gap-4 bg-gradient-to-br from-ink-black to-brand-secondary p-6 text-white sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center bg-brand-primary/15">
            <Crown className="h-5 w-5 text-brand-primary" />
          </div>
          <div>
            <h3 className="font-serif text-base font-bold">Own property to sell or rent?</h3>
            <p className="text-xs text-white/65">Become a Mercury partner — list up to 2 properties &amp; earn through referrals.</p>
          </div>
        </div>
        <button
          onClick={() => router.push(ROUTES.membership)}
          className="btn-gold relative shrink-0 overflow-hidden px-5 py-2.5 text-sm font-bold"
        >
          <span className="relative z-10 flex items-center gap-2">View plans <ArrowUpRight className="h-4 w-4" /></span>
        </button>
      </div>

      {/* Contact rule reminder */}
      <div className="flex items-center gap-3 border border-brand-primary/30 bg-brand-tertiary p-4 text-xs text-brand-secondary/70">
        <Phone className="h-4 w-4 text-brand-primary-dark" />
        <div>
          <b className="text-brand-secondary">Contact rule:</b> free accounts get {contactLimit} lifetime contacts, no monthly reset. Become a member for unlimited contacts.
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, suffix, icon: Icon }: { label: string; value: number | null; suffix?: string; icon: typeof Phone }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card p-5 ring-1 ring-brand-border"
    >
      <div className="flex items-center justify-between">
        <div className="grid h-10 w-10 place-items-center bg-brand-tertiary">
          <Icon className="h-5 w-5 text-brand-primary-dark" />
        </div>
      </div>
      <div className="mt-3 font-serif text-3xl font-bold text-brand-secondary">
        {value === null ? "—" : <AnimatedCounter to={value} suffix={suffix} duration={1.5} />}
      </div>
      <div className="text-xs uppercase tracking-wide text-brand-secondary/55">{label}</div>
    </motion.div>
  )
}
