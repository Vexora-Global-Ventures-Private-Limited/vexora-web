import { Suspense } from "react"
import { PropertiesPage } from "@/components/pages/properties-page"

export default function LandLuxuryVillasPage() {
  return (
    <Suspense fallback={null}>
      <PropertiesPage segment="Land & Luxury Villa" />
    </Suspense>
  )
}
