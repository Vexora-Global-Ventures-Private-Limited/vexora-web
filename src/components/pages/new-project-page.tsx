"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Building2 } from "lucide-react"
import { ROUTES } from "@/lib/routes"
import { useSessionGuard } from "@/lib/use-session-guard"
import { useProjectsStore, PROJECT_QUOTA_VENUS, type ProjectInput } from "@/lib/projects-store"
import { ProjectFormFields, emptyProjectForm, isProjectFormValid } from "@/components/dashboards/tabs/project-form-fields"

export function NewProjectPage() {
  const router = useRouter()
  const { ready, user } = useSessionGuard((u) => !!u && u.tier === "V", ROUTES.dashboard)
  const projects = useProjectsStore((s) => s.projects)
  const addProject = useProjectsStore((s) => s.addProject)

  const [form, setForm] = useState<ProjectInput>(emptyProjectForm)

  if (!ready || !user) return null

  const myProjectCount = projects.filter((p) => p.isMine).length
  const quotaReached = myProjectCount >= PROJECT_QUOTA_VENUS
  const valid = isProjectFormValid(form)

  const handleSubmit = () => {
    if (!valid || quotaReached) return
    const created = addProject(form)
    router.push(ROUTES.projectDetail(created.id))
  }

  return (
    <div className="min-h-screen bg-card">
      <header className="sticky top-0 z-30 border-b border-brand-border-light bg-card/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-3">
          <button
            onClick={() => router.push(ROUTES.dashboardTab("projects"))}
            className="flex items-center gap-2 text-sm font-bold text-brand-secondary/70 hover:text-brand-secondary"
          >
            <ArrowLeft className="h-4 w-4" /> Back to my projects
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-brand-primary-dark" />
          <h1 className="font-serif text-2xl font-bold text-brand-secondary">List a new project</h1>
        </div>
        <p className="mt-1 text-sm text-brand-muted-foreground">
          {myProjectCount} of {PROJECT_QUOTA_VENUS} projects used — a developer project can carry multiple
          configurations, RERA registrations and authorized contacts, unlike a single-unit listing.
        </p>

        <div className="card-sheen mt-6 bg-card p-6">
          <ProjectFormFields form={form} setForm={setForm} />

          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-brand-border pt-5">
            <button
              onClick={handleSubmit}
              disabled={!valid || quotaReached}
              className="btn-gold relative overflow-hidden px-6 py-2.5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span className="relative z-10">Publish project</span>
            </button>
            <button
              onClick={() => router.push(ROUTES.dashboardTab("projects"))}
              className="border border-brand-border bg-card px-5 py-2.5 text-sm font-bold text-brand-secondary hover:bg-brand-surface"
            >
              Cancel
            </button>
            {quotaReached && (
              <span className="text-xs font-semibold text-red-600">
                You&apos;ve reached your {PROJECT_QUOTA_VENUS}-project limit.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
