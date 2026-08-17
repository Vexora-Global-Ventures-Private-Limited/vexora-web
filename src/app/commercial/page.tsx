import { Suspense } from "react"
import { PropertiesPage } from "@/components/pages/properties-page"

export default function CommercialPage() {
  return (
    <Suspense fallback={null}>
      <PropertiesPage segment="Commercial" />
    </Suspense>
  )
}
