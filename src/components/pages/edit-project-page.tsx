"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, RotateCcw, Trash2 } from "lucide-react"
import { ROUTES } from "@/lib/routes"
import { useSessionGuard } from "@/lib/use-session-guard"
import { useProjectsStore, getProjectExpiry, type ProjectInput } from "@/lib/projects-store"
import { ProjectFormFields, projectToFormInput, isProjectFormValid } from "@/components/dashboards/tabs/project-form-fields"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export function EditProjectPage({ projectId }: { projectId: string }) {
  const router = useRouter()
  const { ready, user } = useSessionGuard((u) => !!u && u.tier === "V", ROUTES.dashboard)
  const projects = useProjectsStore((s) => s.projects)
  const updateProject = useProjectsStore((s) => s.updateProject)
  const deleteProject = useProjectsStore((s) => s.deleteProject)
  const renewProject = useProjectsStore((s) => s.renewProject)

  const project = projects.find((p) => p.id === projectId && p.isMine)
  const [form, setForm] = useState<ProjectInput | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (project) setForm(projectToFormInput(project))
  }, [project])

  if (!ready || !user) return null

  if (!project || !form) {
    return (
      <div className="mx-auto max-w-lg px-6 py-24 text-center">
        <h1 className="font-serif text-2xl font-bold text-brand-secondary">Project not found</h1>
        <p className="mt-2 text-sm text-brand-muted-foreground">
          This project may have already been deleted, or doesn&apos;t belong to you.
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

  const valid = isProjectFormValid(form)
  const expiry = getProjectExpiry(project)

  const handleSave = () => {
    if (!valid) return
    updateProject(project.id, form)
    setSaved(true)
    window.setTimeout(() => router.push(ROUTES.projectDetail(project.id)), 700)
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
        <h1 className="font-serif text-2xl font-bold text-brand-secondary">Edit project</h1>
        <p className="mt-1 text-sm text-brand-muted-foreground">
          Update the configurations, RERA registrations and contacts buyers see on this project.
        </p>

        <div className="card-sheen mt-6 bg-card p-6">
          <ProjectFormFields form={form} setForm={setForm} />

          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-brand-border pt-5">
            <button
              onClick={handleSave}
              disabled={!valid}
              className="btn-gold relative overflow-hidden px-6 py-2.5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span className="relative z-10">{saved ? "Saved ✓" : "Save changes"}</span>
            </button>
            <button
              onClick={() => router.push(ROUTES.projectDetail(project.id))}
              className="border border-brand-border bg-card px-5 py-2.5 text-sm font-bold text-brand-secondary hover:bg-brand-surface"
            >
              Cancel
            </button>
          </div>
        </div>

        <div className="mt-6 border border-red-200 bg-card p-6 dark:border-red-900/50">
          <h2 className="font-serif text-lg font-bold text-brand-secondary">Project status</h2>
          <p className="mt-1 text-sm text-brand-muted-foreground">{expiry.label}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            {expiry.expired && (
              <button
                onClick={() => renewProject(project.id)}
                className="flex items-center gap-1.5 border border-brand-border bg-card px-4 py-2 text-sm font-bold text-brand-secondary hover:bg-brand-surface"
              >
                <RotateCcw className="h-4 w-4" /> Renew project
              </button>
            )}
            <button
              onClick={() => setDeleteOpen(true)}
              className="flex items-center gap-1.5 border border-red-200 bg-card px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/30"
            >
              <Trash2 className="h-4 w-4" /> Delete project
            </button>
          </div>
        </div>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this project?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{project.name}&rdquo; will be removed from My Projects and taken off VXP. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                deleteProject(project.id)
                router.push(ROUTES.dashboardTab("projects"))
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
