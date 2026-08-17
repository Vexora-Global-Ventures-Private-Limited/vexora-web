"use client"

import { useState } from "react"
import { Copy, Check, Gift, ShieldCheck, MessageCircle, Mail, Share2 } from "lucide-react"
import type { User } from "@/lib/nav-store"
import { referrals, REFERRAL_REWARD_DAYS } from "@/lib/dashboard-data"
import { getReferralCode, getReferralShareUrl } from "@/lib/referral"
import { StatCard } from "@/components/dashboard/stat-card"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ReferralsTab({ user }: { user: User }) {
  const code = getReferralCode(user)
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}${getReferralShareUrl(code)}` : getReferralShareUrl(code)
  const shareMessage = `Join lifeOS with my referral code ${code} and I get ${REFERRAL_REWARD_DAYS} extension days on my membership: ${shareUrl}`

  const totalReferred = referrals.filter((r) => r.status === "Joined").length
  const totalRewardDays = referrals.reduce((sum, r) => sum + r.rewardDays, 0)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl font-bold text-brand-secondary">Referrals</h2>
        <p className="text-sm text-brand-muted-foreground">Share your code — reward is membership extension days only, no cashback</p>
      </div>

      {/* Code / share URL card */}
      <div className="card-sheen bg-card p-6">
        <h3 className="font-serif text-lg font-bold text-brand-secondary">Your referral code</h3>
        <p className="text-xs text-brand-secondary/55">Anyone who applies this at checkout credits you {REFERRAL_REWARD_DAYS} extension days when their payment captures.</p>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <CopyField value={code} />
          <CopyField value={shareUrl} />
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
        <div className="mt-4 overflow-hidden border border-brand-border">
          <table className="w-full text-sm">
            <thead className="bg-brand-tertiary">
              <tr className="text-[10px] font-bold uppercase tracking-wide text-brand-secondary/55">
                <th className="px-4 py-2 text-left">Referred</th>
                <th className="px-4 py-2 text-left">Joined</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-right">Reward days</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {referrals.map((r) => (
                <tr key={r.id} className="text-xs">
                  <td className="px-4 py-2.5 font-semibold text-brand-secondary">{r.referred}</td>
                  <td className="px-4 py-2.5 text-brand-secondary/65">{r.joined}</td>
                  <td className="px-4 py-2.5">
                    <span className={"rounded-full px-2 py-0.5 text-[10px] font-bold " + (r.status === "Joined" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700")}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right font-bold text-brand-primary-dark">{r.rewardDays > 0 ? `+${r.rewardDays} d` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <InviteFriendsButton shareUrl={shareUrl} shareMessage={shareMessage} />
      </div>

      {/* No-cashback disclaimer */}
      <div className="flex items-center gap-3 border border-brand-primary/30 bg-brand-tertiary p-4 text-xs text-brand-secondary/70">
        <ShieldCheck className="h-4 w-4 shrink-0 text-brand-primary-dark" />
        <div>
          <b className="text-brand-secondary">Extension days only — no cashback.</b> Referral rewards extend your membership's expiry date; there is no wallet payout.
        </div>
      </div>
    </div>
  )
}

function InviteFriendsButton({ shareUrl, shareMessage }: { shareUrl: string; shareMessage: string }) {
  const [copied, setCopied] = useState(false)

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  const nativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      await navigator.share({ title: "Join lifeOS", text: shareMessage, url: shareUrl }).catch(() => {})
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
          <a href={`mailto:?subject=${encodeURIComponent("Join lifeOS")}&body=${encodeURIComponent(shareMessage)}`}>
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

function CopyField({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div className="flex items-center gap-2 border border-brand-border bg-brand-surface px-3 py-2.5">
      <span className="flex-1 truncate text-xs font-semibold text-brand-secondary">{value}</span>
      <button
        onClick={copy}
        className="flex shrink-0 items-center gap-1 text-[11px] font-bold text-brand-primary-dark hover:text-brand-secondary"
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  )
}
