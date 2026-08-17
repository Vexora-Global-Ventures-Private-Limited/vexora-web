import { Suspense } from "react"
import { ProjectsPage } from "@/components/pages/projects-page"

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ProjectsPage />
    </Suspense>
  )
}
