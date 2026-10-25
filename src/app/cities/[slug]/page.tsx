import type { Metadata } from "next"
import { CityDetailPage } from "@/components/pages/city-detail-page"
import { getCityBySlug } from "@/lib/vxp-data"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const city = getCityBySlug(slug)
  if (!city) return { title: "City not found — VXP" }

  // Live counts are rendered client-side from the search API — the
  // description stays count-free rather than baking in a stale number.
  return {
    title: `Real Estate in ${city.name} — Properties & Developer Projects | VXP`,
    description: `${city.blurb} Browse verified properties and developer projects in ${city.name} on VXP.`,
  }
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return <CityDetailPage slug={slug} />
}
