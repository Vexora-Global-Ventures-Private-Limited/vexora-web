import { Suspense } from "react"
import { PromotePage } from "@/components/pages/promote-page"

export default function Page() {
  return (
    <Suspense fallback={null}>
      <PromotePage />
    </Suspense>
  )
}
