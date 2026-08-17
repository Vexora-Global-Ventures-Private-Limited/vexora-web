"use client"

import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import {
  projects as seedProjects,
  type Project, type ProjectStatus, type ProjectConfiguration,
  type ProjectRera, type ProjectHighlight, type ProjectGalleryImage, type ProjectContact,
} from "@/lib/projects-data"

export type ProjectInput = {
  name: string
  developer: string
  location: string
  city: string
  status: ProjectStatus
  possessionDate: string
  zeroBrokerage: boolean
  configurations: ProjectConfiguration[]
  reraRegistrations: ProjectRera[]
  highlights: ProjectHighlight[]
  amenities: string[]
  coverImage: string
  gallery: ProjectGalleryImage[]
  contacts: ProjectContact[]
  description: string
  brochureUrl?: string
}

/** Projects stay live for 90 days from creation before they need renewing —
 *  same validity window as Listing (see getListingExpiry in dashboard-data.ts). */
export const PROJECT_VALIDITY_DAYS = 90

/** Venus-only feature; no per-tier table needed since only Venus can create projects. */
export const PROJECT_QUOTA_VENUS = 20

export function getProjectExpiry(project: Project) {
  const expiresAt = new Date(project.createdAt ?? Date.now())
  expiresAt.setDate(expiresAt.getDate() + PROJECT_VALIDITY_DAYS)
  const daysLeft = Math.ceil((expiresAt.getTime() - Date.now()) / 86_400_000)
  const expired = daysLeft < 0
  const tone: "success" | "warning" | "danger" = expired ? "danger" : daysLeft <= 14 ? "warning" : "success"
  const label = expired
    ? `Expired ${Math.abs(daysLeft)}d ago`
    : daysLeft === 0
      ? "Expires today"
      : `Expires in ${daysLeft}d`
  return { expiresAt, daysLeft, expired, tone, label }
}

function formatProject(input: ProjectInput): Omit<
  Project,
  "id" | "priority" | "tags" | "pos" | "isMine" | "createdAt" | "views" | "enquiries" | "contactsUnlocked" | "viewedThisWeek" | "interestedThisWeek" | "developerVerified" | "developerMemberSince"
> {
  // Flat gallery set mirrors Property.galleryImages, cover photo first, no duplicates.
  const galleryImages = Array.from(new Set([input.coverImage, ...input.gallery.map((g) => g.src)]))
  return {
    name: input.name,
    developer: input.developer,
    location: input.location,
    city: input.city,
    status: input.status,
    possessionDate: input.possessionDate,
    zeroBrokerage: input.zeroBrokerage,
    coverImage: input.coverImage,
    galleryImages,
    gallery: input.gallery,
    configurations: input.configurations,
    reraRegistrations: input.reraRegistrations,
    highlights: input.highlights,
    amenities: input.amenities,
    brochureUrl: input.brochureUrl,
    contacts: input.contacts,
    description: input.description,
  }
}

type ProjectsState = {
  projects: Project[]
  addProject: (input: ProjectInput) => Project
  updateProject: (id: string, input: ProjectInput) => void
  deleteProject: (id: string) => void
  renewProject: (id: string) => void
}

/**
 * Mock developer-project store. No real backend here — client-persisted demo
 * seeded from the full `projects` catalog in projects-data.ts (this store is
 * the single source of truth for both the public /projects catalog and the
 * Venus "My Projects" dashboard tab; unlike Property/Listing there is no
 * separate static ground-truth array, since only the owning Venus user ever
 * edits a project).
 */
export const useProjectsStore = create<ProjectsState>()(
  persist(
    (set) => ({
      projects: seedProjects,

      addProject: (input) => {
        const project: Project = {
          id: `PRJ-${Date.now()}`,
          priority: "Organic",
          tags: [],
          isMine: true,
          createdAt: new Date().toISOString().slice(0, 10),
          // Honest default — a newly self-listed developer starts unverified
          // until VXP reviews them, same convention as Property.developerVerified.
          developerVerified: false,
          views: 0,
          enquiries: 0,
          contactsUnlocked: 0,
          viewedThisWeek: 0,
          interestedThisWeek: 0,
          ...formatProject(input),
        }
        set((state) => ({ projects: [project, ...state.projects] }))
        return project
      },

      updateProject: (id, input) => {
        set((state) => ({
          projects: state.projects.map((p) => (p.id === id ? { ...p, ...formatProject(input) } : p)),
        }))
      },

      deleteProject: (id) => {
        set((state) => ({ projects: state.projects.filter((p) => p.id !== id) }))
      },

      renewProject: (id) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, createdAt: new Date().toISOString().slice(0, 10) } : p,
          ),
        }))
      },
    }),
    {
      name: "vxp-projects-demo",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    },
  ),
)
