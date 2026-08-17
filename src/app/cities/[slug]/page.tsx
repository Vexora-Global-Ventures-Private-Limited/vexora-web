import type { Metadata } from "next"
import { CityDetailPage } from "@/components/pages/city-detail-page"
import { getCityBySlug, propertiesInCity } from "@/lib/vxp-data"
import { projectsInCity } from "@/lib/projects-data"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const city = getCityBySlug(slug)
  if (!city) return { title: "City not found — VXP" }

  const listingCount = propertiesInCity(city.name).length
  const projectCount = projectsInCity(city.name).length
  return {
    title: `Real Estate in ${city.name} — Properties & Developer Projects | VXP`,
    description: `${city.blurb} Browse ${listingCount} verified propert${listingCount === 1 ? "y" : "ies"} and ${projectCount} developer project${projectCount === 1 ? "" : "s"} in ${city.name} on VXP.`,
  }
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return <CityDetailPage slug={slug} />
}
