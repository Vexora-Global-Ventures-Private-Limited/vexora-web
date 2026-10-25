"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft, ExternalLink } from "lucide-react"
import { ROUTES } from "@/lib/routes"
import { useSessionGuard } from "@/lib/use-session-guard"
import { getApiErrorCode } from "@/lib/api-error"
import { useGetMyBuilderProfileQuery, useGetProjectQuery } from "@/store/api/listingsApi"
import { isObjectId } from "@/components/listings/project-helpers"
import { ProjectInventoryEditor } from "@/components/listings/project-inventory-editor"

/**
 * Venus inventory management for one project: details (PATCH /projects/:id)
 * plus towers and units. The API has no project delete/renew endpoints, so
 * those prototype actions are gone.
 */
export function EditProjectPage({ projectId }: { projectId: string }) {
  const router = useRouter()
  const { ready, user } = useSessionGuard((u) => !!u && u.tier === "V", ROUTES.dashboard)
  const validId = isObjectId(projectId)
  const { data: project, isLoading, isFetching, error, refetch } = useGetProjectQuery(projectId, {
    skip: !validId || !ready || !user?.id,
    refetchOnMountOrArgChange: true,
  })
  const { data: myProfile, isLoading: profileLoading } = useGetMyBuilderProfileQuery(undefined, { skip: !ready || !user?.id })

  if (!ready || !user) return null

  if (isLoading || profileLoading) {
    return <div className="mx-auto max-w-3xl px-6 py-24 text-center text-sm text-brand-muted-foreground">Loading project…</div>
  }

  const code = getApiErrorCode(error)
  if (validId && error && (!code || code === "INTERNAL")) {
    return (
      <div className="mx-auto max-w-lg px-6 py-24 text-center">
        <h1 className="font-serif text-2xl font-bold text-brand-secondary">Couldn&apos;t load this project</h1>
        <p className="mt-2 text-sm text-brand-muted-foreground">Check your connection and try again.</p>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="btn-gold relative mt-6 overflow-hidden px-5 py-2.5 text-sm font-bold disabled:opacity-60"
        >
          <span className="relative z-10">{isFetching ? "Retrying…" : "Retry"}</span>
        </button>
      </div>
    )
  }

  // GET /projects/:id is public, so a project loading doesn't mean it's
  // ours — only show the editor for our own (writes would 403 anyway).
  const isOwner =
    !!project && (project.ownerId === user.id || (!!myProfile && !!project.builderProfileId && project.builderProfileId === myProfile._id))

  if (!validId || !project || !isOwner) {
    return (
      <div className="mx-auto max-w-lg px-6 py-24 text-center">
        <h1 className="font-serif text-2xl font-bold text-brand-secondary">
          {project && !isOwner ? "This isn't your project" : "Project not found"}
        </h1>
        <p className="mt-2 text-sm text-brand-muted-foreground">
          {project && !isOwner ? "Only the developer who listed it can manage its inventory." : "This project may have been removed."}
        </p>
        <button
          onClick={() => router.push(ROUTES.dashboardTab("projects"))}
          className="btn-gold relative mt-6 overflow-hidden px-5 py-2.5 text-sm font-bold"
        >
          <span className="relative z-10">Back to My Projects</span>
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-card">
      <header className="sticky top-0 z-30 border-b border-brand-border-light bg-card/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-3">
          <button
            onClick={() => router.push(ROUTES.dashboardTab("projects"))}
            className="flex items-center gap-2 text-sm font-bold text-brand-secondary/70 hover:text-brand-secondary"
          >
            <ArrowLeft className="h-4 w-4" /> Back to my projects
          </button>
          <button
            onClick={() => router.push(ROUTES.projectDetail(project._id))}
            className="flex items-center gap-1.5 text-xs font-bold text-brand-primary-dark hover:text-brand-secondary"
          >
            View public page <ExternalLink className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-8">
        <h1 className="font-serif text-2xl font-bold text-brand-secondary">{project.name}</h1>
        <p className="mt-1 text-sm text-brand-muted-foreground">Manage project details, towers and unit availability.</p>
        <div className="mt-6">
          <ProjectInventoryEditor project={project} />
        </div>
      </div>
    </div>
  )
}
