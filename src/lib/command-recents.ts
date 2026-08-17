const RECENTS_KEY = "vxp-command-recents"
const MAX_RECENTS = 6

export type CommandRecent = {
  id: string
  label: string
  action: string
}

export function loadCommandRecents(): CommandRecent[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(RECENTS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as CommandRecent[]
    return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENTS) : []
  } catch {
    return []
  }
}

export function pushCommandRecent(item: CommandRecent) {
  const prev = loadCommandRecents().filter((r) => r.id !== item.id)
  const next = [item, ...prev].slice(0, MAX_RECENTS)
  localStorage.setItem(RECENTS_KEY, JSON.stringify(next))
  return next
}
