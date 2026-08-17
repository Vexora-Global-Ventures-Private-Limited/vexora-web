"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Search, Eye, MessageCircle, Phone, ChevronRight, Layers3, Plus, Pencil, Trash2, RotateCcw, FileCheck2, ShieldAlert } from "lucide-react"
import { useRouter } from "next/navigation"
import { ROUTES } from "@/lib/routes"
import { useProjectsStore, getProjectExpiry, PROJECT_QUOTA_VENUS } from "@/lib/projects-store"
import { projectPriceRangeCr, type Project } from "@/lib/projects-data"
import { StatusPill } from "@/components/dashboard/status-pill"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export function ProjectsTab() {
  const router = useRouter()
  const allProjects = useProjectsStore((s) => s.projects)
  const deleteProject = useProjectsStore((s) => s.deleteProject)
  const renewProject = useProjectsStore((s) => s.renewProject)

  const [query, setQuery] = useState("")
  const [priorityFilter, setPriorityFilter] = useState<"All" | "Sponsored" | "Featured" | "Organic">("All")
  const [deletingProject, setDeletingProject] = useState<Project | null>(null)

  const myProjects = allProjects.filter((p) => p.isMine)
  const quotaReached = myProjects.length >= PROJECT_QUOTA_VENUS

  const filtered = myProjects
    .filter((p) => priorityFilter === "All" || p.priority === priorityFilter)
    .filter((p) => p.name.toLowerCase().includes(query.toLowerCase()) || p.location.toLowerCase().includes(query.toLowerCase()))

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl font-bold text-brand-secondary">My Projects</h2>
          <p className="text-sm text-brand-muted-foreground">
            {myProjects.length} of {PROJECT_QUOTA_VENUS} used — each card links to the full project page
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(ROUTES.projects)}
            className="flex items-center gap-1 text-xs font-bold text-brand-primary-dark hover:text-brand-secondary"
          >
            Browse all projects <ChevronRight className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => router.push(ROUTES.newProject)}
            disabled={quotaReached}
            className="btn-gold relative flex items-center gap-1.5 overflow-hidden px-4 py-2 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span className="relative z-10 flex items-center gap-1.5">
              <Plus className="h-3.5 w-3.5" /> New Project
            </span>
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-secondary/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your projects by name or location..."
            className="w-full border border-brand-border bg-card py-2.5 pl-10 pr-4 text-sm outline-none focus:border-brand-primary"
          />
        </div>
        <div className="flex items-center gap-2">
          {(["All", "Sponsored", "Featured", "Organic"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setPriorityFilter(f)}
              className={
                "px-3 py-2 text-xs font-bold transition-colors " +
                (priorityFilter === f
                  ? "bg-brand-secondary text-brand-primary"
                  : "border border-brand-border bg-card text-brand-secondary/65 hover:bg-brand-tertiary")
              }
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card-sheen bg-card p-10 text-center text-sm text-brand-secondary/60">
          {myProjects.length === 0 ? "You haven't listed a project yet." : "No projects match your search."}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p, i) => {
            const { expired, tone, label } = getProjectExpiry(p)
            const { min, max } = projectPriceRangeCr(p)
            const reraOk = p.reraRegistrations.length > 0
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="card-sheen group overflow-hidden bg-card"
              >
                <button onClick={() => router.push(ROUTES.projectDetail(p.id))} className="block w-full text-left">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img src={p.coverImage} alt={p.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-secondary/50 to-transparent" />
                    <div className="absolute left-3 top-3 flex gap-1.5">
                      <StatusPill tone={p.priority === "Sponsored" ? "warning" : p.priority === "Featured" ? "info" : "neutral"}>
                        {p.priority}
                      </StatusPill>
                      {reraOk ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-card/95 px-2 py-0.5 text-[10px] font-bold text-green-700">
                          <FileCheck2 className="h-3 w-3" /> RERA
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-card/95 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                          <ShieldAlert className="h-3 w-3" /> Pending
                        </span>
                      )}
                    </div>
                    <div className="absolute bottom-3 left-3 font-serif text-lg font-bold text-white">
                      {min === max ? `₹ ${min} Cr` : `₹ ${min} – ${max} Cr`}
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-brand-primary-dark">
                      <Layers3 className="h-3 w-3" /> {p.configurations.length} configuration{p.configurations.length === 1 ? "" : "s"} · {p.status}
                    </div>
                    <h3 className="mt-1.5 truncate font-serif text-base font-bold text-brand-secondary">{p.name}</h3>
                    <p className="truncate text-xs text-brand-secondary/55">{p.location}</p>
                    <div className="mt-3 flex items-center gap-3 border-t border-brand-border pt-3 text-[11px] text-brand-secondary/70">
                      <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5 text-brand-primary-dark" /> {(p.views ?? 0).toLocaleString()}</span>
                      <span className="flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5 text-brand-primary-dark" /> {p.enquiries ?? 0}</span>
                      <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5 text-brand-primary-dark" /> {p.contactsUnlocked ?? 0}</span>
                    </div>
                  </div>
                </button>

                <div className="flex items-center justify-between gap-2 border-t border-brand-border px-4 py-2.5">
                  <StatusPill tone={tone}>{label}</StatusPill>
                  <div className="flex items-center gap-1.5">
                    {expired && (
                      <button
                        type="button"
                        onClick={() => renewProject(p.id)}
                        title="Renew project"
                        className="grid h-7 w-7 place-items-center border border-brand-border text-brand-secondary/60 hover:bg-brand-tertiary hover:text-brand-secondary"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => router.push(ROUTES.editProject(p.id))}
                      title="Edit project"
                      className="grid h-7 w-7 place-items-center border border-brand-border text-brand-secondary/60 hover:bg-brand-tertiary hover:text-brand-secondary"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingProject(p)}
                      title="Delete project"
                      className="grid h-7 w-7 place-items-center border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/30"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {quotaReached && (
        <div className="flex items-center gap-2 bg-brand-tertiary p-3 text-xs text-brand-secondary/70">
          Project limit reached — contact your account manager to raise your quota.
        </div>
      )}

      <AlertDialog open={!!deletingProject} onOpenChange={(open) => !open && setDeletingProject(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this project?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{deletingProject?.name}&rdquo; will be removed from My Projects and taken off VXP. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingProject) deleteProject(deletingProject.id)
                setDeletingProject(null)
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
