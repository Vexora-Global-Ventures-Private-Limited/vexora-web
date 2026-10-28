"use client"

import { useRouter } from "next/navigation"
import { ROUTES } from "@/lib/routes"
import { ApiProjectDetail } from "@/components/listings/api-project-detail"
import { isObjectId } from "@/components/listings/project-helpers"

/**
 * Project page. Real projects (Mongo ObjectIds from the API) render the live
 * inventory page. Any other id — including the old prototype sample ids
 * ("prj1"…) — is not a real project, so it gets "Project not found" rather
 * than a mock page.
 */
export function ProjectDetailPage({ projectId }: { projectId: string }) {
  if (isObjectId(projectId)) return <ApiProjectDetail projectId={projectId} />
  return <ProjectNotFound />
}

function ProjectNotFound() {
  const router = useRouter()
  return (
    <div className="mx-auto max-w-lg px-6 py-24 text-center">
      <h1 className="font-serif text-2xl font-bold text-brand-secondary">Project not found</h1>
      <p className="mt-2 text-sm text-brand-muted-foreground">This link doesn&apos;t match any project on VXP.</p>
      <button onClick={() => router.push(ROUTES.projects)} className="btn-gold relative mt-6 overflow-hidden px-5 py-2.5 text-sm font-bold">
        <span className="relative z-10">Browse projects</span>
      </button>
    </div>
  )
}
