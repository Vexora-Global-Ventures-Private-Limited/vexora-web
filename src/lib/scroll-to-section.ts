/** Smooth-scroll to a homepage section by id (e.g. "buy" → #buy). */
export function scrollToSection(id: string, behavior: ScrollBehavior = "smooth") {
  if (typeof window === "undefined") return false
  const el = document.getElementById(id)
  if (!el) return false
  el.scrollIntoView({ behavior, block: "start" })
  return true
}
