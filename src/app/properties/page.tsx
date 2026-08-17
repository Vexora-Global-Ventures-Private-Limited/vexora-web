import { Suspense } from "react"
import { PropertiesPage } from "@/components/pages/properties-page"

export default function Page() {
  return (
    <Suspense fallback={null}>
      <PropertiesPage />
    </Suspense>
  )
}
