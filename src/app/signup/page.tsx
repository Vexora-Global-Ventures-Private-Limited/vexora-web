import { Suspense } from "react"
import { SignupPage } from "@/components/pages/signup-page"

export default function Page() {
  return (
    <Suspense fallback={null}>
      <SignupPage />
    </Suspense>
  )
}
