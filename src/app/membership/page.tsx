import { Suspense } from "react"
import { MembershipPage } from "@/components/pages/membership-page"

export default function Page() {
  return (
    <Suspense fallback={null}>
      <MembershipPage />
    </Suspense>
  )
}
