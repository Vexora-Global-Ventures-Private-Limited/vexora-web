import { Suspense } from "react"
import { PropertiesPage } from "@/components/pages/properties-page"

export default function GlobalPropertiesPage() {
  return (
    <Suspense fallback={null}>
      <PropertiesPage segment="Global" />
    </Suspense>
  )
}
