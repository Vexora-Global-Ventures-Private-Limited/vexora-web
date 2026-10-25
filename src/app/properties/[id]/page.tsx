import type { Metadata } from "next"
import { PropertyDetailPage } from "@/components/pages/property-detail-page"
import { formatPaise } from "@/lib/api-mappers"
import type { SearchDocument } from "@/store/api/searchApi"

/**
 * Real <title>/description per listing (the page body itself renders
 * client-side). Same public GET /properties/:slug the page calls; the
 * backend caches it for 5 minutes, so this re-validates on the same beat.
 */
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id: slug } = await params
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/properties/${encodeURIComponent(slug)}`, {
      next: { revalidate: 300 },
    })
    if (!res.ok) return { title: "Listing not available — VXP" }
    const { data: doc } = (await res.json()) as { data: SearchDocument }
    const place = [doc.locality, doc.city].filter(Boolean).join(", ")
    const price = doc.price ? formatPaise(doc.price) : null
    return {
      title: `${doc.title}${place ? ` — ${place}` : ""} | VXP`,
      description:
        doc.description?.trim().slice(0, 160) ||
        [`For ${doc.purpose}`, place, price].filter(Boolean).join(" · ") + " — verified listing on VXP.",
    }
  } catch {
    return { title: "Property — VXP" }
  }
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <PropertyDetailPage propertyId={id} />
}
