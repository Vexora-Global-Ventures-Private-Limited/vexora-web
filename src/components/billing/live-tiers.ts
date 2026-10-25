"use client"

import { useMemo } from "react"
import { membershipTiers, type MembershipTier } from "@/lib/vxp-data"
import { formatPaise } from "@/lib/api-mappers"
import { useGetMembershipPlansQuery, type MembershipPlan } from "@/store/api/billingApi"

const TIER_CODE: Record<MembershipPlan["tier"], MembershipTier["code"]> = { mercury: "M", jupiter: "J", venus: "V" }

export type LiveTier = MembershipTier & {
  planId?: string
  pricePaise?: number
  /** The plan's real feature flags (crmBoard / badges / coBroker) — absent until plans load. */
  planFeatures?: MembershipPlan["features"]
  /** No live plan to sell: still loading, the call failed, or the plan is inactive. */
  unavailable: boolean
}

function formatDuration(days: number) {
  if (days % 365 === 0) return days === 365 ? "1 year" : `${days / 365} years`
  if (days % 30 === 0) return days === 30 ? "1 month" : `${days / 30} months`
  return `${days} days`
}

// Static copy that states a listing count would contradict the live quota.
const QUOTA_LINE = /\b\d+\s+(verified\s+)?listings?\b/i

/**
 * Tier cards = marketing copy from vxp-data (tagline, audience, feature
 * bullets — the API has none of that) overlaid with the real plan from
 * GET /membership-plans: price, duration, listing quota, feature flags and
 * planId. Until the plans load (or if that call fails) the price shows as
 * "—" and the tier is `unavailable` — the prototype's static prices are
 * never shown, and nothing can be bought off a stale price.
 */
export function useLiveTiers() {
  const { data: plans, isLoading, isError, refetch } = useGetMembershipPlansQuery()

  const tiers = useMemo<LiveTier[]>(() => {
    return membershipTiers.map((tier) => {
      const plan = plans?.find((p) => p.isActive && TIER_CODE[p.tier] === tier.code)
      if (!plan) {
        return {
          ...tier,
          price: "—",
          features: tier.features.filter((f) => !QUOTA_LINE.test(f)),
          unavailable: true,
        }
      }
      return {
        ...tier,
        name: plan.name || tier.name,
        planId: plan._id,
        pricePaise: plan.pricePaise,
        price: plan.pricePaise ? formatPaise(plan.pricePaise) : "Free",
        duration: formatDuration(plan.durationDays),
        listings: plan.listingQuota,
        planFeatures: plan.features,
        features: [`Up to ${plan.listingQuota} listings`, ...tier.features.filter((f) => !QUOTA_LINE.test(f))],
        unavailable: false,
      }
    })
  }, [plans])

  return { tiers, isLoading, isError, refetch }
}
