"use client"

import { useSearchQuery } from "@/store/api/searchApi"

const SAMPLE = 50

/**
 * Live listing count + starting price for one city, from GET /search.
 *
 * The starting price is the lowest non-zero price on the first page, so it's
 * only reported when that page holds every listing in the city (the search
 * fallback ignores `sort`, so price_asc can't be trusted to surface the
 * cheapest one first). Bigger cities just show the count.
 */
export function useCityStats(cityName: string) {
  const { data, isLoading, isError } = useSearchQuery({ city: cityName, limit: SAMPLE })
  const count = data?.total ?? 0
  const prices = (data?.hits ?? []).map((h) => h.price).filter((p) => p > 0)
  const startingPriceCr =
    data && data.total <= SAMPLE && prices.length > 0
      ? Number((Math.min(...prices) / 100 / 1e7).toFixed(2))
      : undefined
  // isError: the count is unknown — callers must not render it as "0 listings".
  return { count, startingPriceCr, isLoading, isError }
}

export function formatStartingPrice(cr: number) {
  return cr >= 1 ? `from ₹ ${cr} Cr` : `from ₹ ${Number((cr * 100).toFixed(1))} L`
}
