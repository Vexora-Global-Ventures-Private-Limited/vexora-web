"use client"

import { useState } from "react"
import { Copy, Check, Gift, ShieldCheck, MessageCircle, Mail, Share2 } from "lucide-react"
import { useRouter } from "next/navigation"
import type { User } from "@/lib/nav-store"
import { ROUTES } from "@/lib/routes"
import { getReferralShareUrl } from "@/lib/referral"
import { getApiErrorCode, getApiErrorMessage } from "@/lib/api-error"
import { useGetMyReferralCodeQuery, useGetReferralHistoryQuery } from "@/store/api/referralsApi"
import { StatCard } from "@/components/dashboard/stat-card"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

/**
 * Real referral code + history (GET /referrals/my-code, /referrals/history).
 * Both are members-only — a 402 MEMBERSHIP_REQUIRED (e.g. a lapsed member)
 * turns into the upsell instead of an error.
 */
function formatDay(iso: string | undefined) {
  const d = iso ? new Date(iso) : null
  return d && !Number.isNaN(d.getTime())
    ? d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "—"
}

export function ReferralsTab({ user }: { user: User }) {
  const router = useRouter()
  const { data: myCode, error: codeError, isLoading, refetch: refetchCode } = useGetMyReferralCodeQuery(undefined, { skip: !user.id })
  const { data: history } = useGetReferralHistoryQuery(undefined, { skip: !user.id || !myCode })

  if (isLoading) return <p className="text-sm text-brand-secondary/55">Loading your referral code…</p>

  // 402 when the membership has lapsed (the tab is shown off the cached tier).
  if (!user.id || getApiErrorCode(codeError) === "MEMBERSHIP_REQUIRED" || (codeError as { status?: number } | undefined)?.status === 402) {
    return (
      <div className="space-y-4 bg-card p-6 ring-1 ring-brand-border">
        <h2 className="font-serif text-2xl font-bold text-brand-secondary">Referrals</h2>
        <p className="text-sm text-brand-secondary/65">Referral codes come with an active paid membership.</p>
        <button onClick={() => router.push(ROUTES.membership)} className="btn-gold relative overflow-hidden px-5 py-2.5 text-sm font-bold">
          <span className="relative z-10">View membership plans</span>
        </button>
      </div>
    )
  }

  if (codeError || !myCode) {
    return (
      <p role="alert" className="text-sm text-red-600">
        {getApiErrorMessage(codeError) ?? "Couldn't load your referral code."}{" "}
        <button onClick={() => refetchCode()} className="font-bold underline">Retry</button>
      </p>
    )
  }

  const code = myCode.code
  const sharePath = myCode.shareUrl ?? getReferralShareUrl(code)
  const shareUrl = /^https?:\/\//.test(sharePath)
    ? sharePath
    : typeof window !== "undefined"
      ? `${window.location.origin}${sharePath}`
      : sharePath
  const shareMessage = `Join VXP with my referral code ${code} — I earn extension days on my membership when you join: ${shareUrl}`
  const rows = history ?? []
  const totalReferred = myCode.totalReferred ?? rows.length
  const totalRewardDays = myCode.totalRewardDays ?? rows.reduce((sum, r) => sum + (r.rewardDays ?? 0), 0)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl font-bold text-brand-secondary">Referrals</h2>
        <p className="text-sm text-brand-muted-foreground">Share your code — reward is membership extension days only, no cashback</p>
      </div>

      {/* Code / share URL card */}
      <div className="card-sheen bg-card p-6">
        <h3 className="font-serif text-lg font-bold text-brand-secondary">Your referral code</h3>
        <p className="text-xs text-brand-secondary/55">Anyone who applies this to their first membership credits you extension days when their payment captures.</p>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <CopyField value={code} label="referral code" />
          <CopyField value={shareUrl} label="share link" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-2">
        <StatCard label="Friends Referred" value={totalReferred} icon={Gift} />
        <StatCard label="Reward Days Earned" value={totalRewardDays} suffix=" days" icon={ShieldCheck} />
      </div>

      {/* History */}
      <div className="bg-card p-6 ring-1 ring-brand-border">
        <h3 className="font-serif text-lg font-bold text-brand-secondary">Referral history</h3>
        {rows.length === 0 ? (
          <p className="mt-4 text-sm text-brand-secondary/55">No one has used your code yet.</p>
        ) : (
          <div className="mt-4 overflow-hidden border border-brand-border">
            <table className="w-full text-sm">
              <thead className="bg-brand-tertiary">
                <tr className="text-[10px] font-bold uppercase tracking-wide text-brand-secondary/55">
                  <th className="px-4 py-2 text-left">Referred</th>
                  <th className="px-4 py-2 text-left">Joined</th>
                  <th className="px-4 py-2 text-right">Reward days</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {rows.map((r, i) => (
                  <tr key={r._id ?? r.id ?? i} className="text-xs">
                    <td className="px-4 py-2.5 font-semibold text-brand-secondary">{r.refereeName ?? "New member"}</td>
                    <td className="px-4 py-2.5 text-brand-secondary/65">{formatDay(r.createdAt)}</td>
                    <td className="px-4 py-2.5 text-right font-bold text-brand-primary-dark">{r.rewardDays ? `+${r.rewardDays} d` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <InviteFriendsButton shareUrl={shareUrl} shareMessage={shareMessage} />
      </div>

      {/* No-cashback disclaimer */}
      <div className="flex items-center gap-3 border border-brand-primary/30 bg-brand-tertiary p-4 text-xs text-brand-secondary/70">
        <ShieldCheck className="h-4 w-4 shrink-0 text-brand-primary-dark" />
        <div>
          <b className="text-brand-secondary">Extension days only — no cashback.</b> Referral rewards extend your membership&apos;s expiry date; there is no wallet payout.
        </div>
      </div>
    </div>
  )
}

function InviteFriendsButton({ shareUrl, shareMessage }: { shareUrl: string; shareMessage: string }) {
  const [copied, setCopied] = useState(false)

  const copyLink = async () => {
    if (await copyText(shareUrl)) {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    }
  }

  const nativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      await navigator.share({ title: "Join VXP", text: shareMessage, url: shareUrl }).catch(() => {})
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="btn-gold relative mt-4 overflow-hidden px-5 py-2.5 text-sm font-bold outline-none">
        <span className="relative z-10 flex items-center gap-2"><Gift className="h-4 w-4" /> Invite friends</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuItem asChild>
          <a href={`https://wa.me/?text=${encodeURIComponent(shareMessage)}`} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="h-4 w-4" /> Share via WhatsApp
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={`mailto:?subject=${encodeURIComponent("Join VXP")}&body=${encodeURIComponent(shareMessage)}`}>
            <Mail className="h-4 w-4" /> Share via Email
          </a>
        </DropdownMenuItem>
        {typeof navigator !== "undefined" && !!navigator.share && (
          <DropdownMenuItem onClick={nativeShare}>
            <Share2 className="h-4 w-4" /> More sharing options…
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={copyLink}>
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied ? "Copied!" : "Copy link"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * navigator.clipboard is missing on plain-http origins and can be denied by
 * the browser — the unguarded call threw an unhandled rejection. Returns
 * whether the copy actually happened.
 */
async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

function CopyField({ value, label }: { value: string; label: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle")

  const copy = async () => {
    setStatus((await copyText(value)) ? "copied" : "failed")
    setTimeout(() => setStatus("idle"), 1800)
  }

  return (
    <div className="flex items-center gap-2 border border-brand-border bg-brand-surface px-3 py-2.5">
      <span className="flex-1 select-all truncate text-xs font-semibold text-brand-secondary" title={value}>{value}</span>
      <button
        onClick={copy}
        aria-label={`Copy ${label}`}
        className="flex shrink-0 items-center gap-1 text-[11px] font-bold text-brand-primary-dark hover:text-brand-secondary"
      >
        {status === "copied" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        <span aria-live="polite">{status === "copied" ? "Copied" : status === "failed" ? "Select & copy" : "Copy"}</span>
      </button>
    </div>
  )
}
