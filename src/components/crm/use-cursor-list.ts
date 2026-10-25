"use client"

import { useCallback, useEffect, useRef, useState } from "react"

type Page<T> = { items: T[]; nextCursor: string | null }

/**
 * Accumulates a cursor-paginated list (GET /crm/leads, GET /notifications —
 * the two real cursor endpoints in this API) into one array with a "load
 * more". Mount it under a `key` derived from the filters so a filter change
 * starts a fresh list instead of appending to the old one.
 *
 * `status` is "error" for a failed first load; a failed "load more" keeps
 * the rows already shown and sets `loadMoreFailed` instead, so the screen
 * can offer a retry without blanking the list.
 */
export function useCursorList<T>(fetchPage: (cursor: string | undefined) => Promise<Page<T>>) {
  const [items, setItems] = useState<T[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [status, setStatus] = useState<"loading" | "idle" | "loadingMore" | "error">("loading")
  const [loadMoreFailed, setLoadMoreFailed] = useState(false)
  // Always call the latest fetcher (it closes over the current filters)
  // without re-running the initial-load effect on every render.
  const fetchRef = useRef(fetchPage)
  useEffect(() => {
    fetchRef.current = fetchPage
  })
  // Only the newest request may write state — a Refresh fired while a
  // "load more" is still in flight must not have the older page appended
  // onto the fresh list when it finally lands.
  const requestSeq = useRef(0)
  const inFlight = useRef(false)

  const load = useCallback(async (cursor: string | undefined, append: boolean) => {
    const seq = ++requestSeq.current
    inFlight.current = true
    try {
      const page = await fetchRef.current(cursor)
      if (seq !== requestSeq.current) return
      setItems((prev) => (append ? [...prev, ...page.items] : page.items))
      setNextCursor(page.nextCursor)
      setLoadMoreFailed(false)
      setStatus("idle")
    } catch {
      if (seq !== requestSeq.current) return
      if (append) {
        setLoadMoreFailed(true)
        setStatus("idle")
      } else {
        setStatus("error")
      }
    } finally {
      if (seq === requestSeq.current) inFlight.current = false
    }
  }, [])

  useEffect(() => {
    void load(undefined, false)
  }, [load])

  const loadMore = useCallback(() => {
    if (!nextCursor || inFlight.current) return
    setStatus("loadingMore")
    void load(nextCursor, true)
  }, [nextCursor, load])

  const reload = useCallback(() => {
    setStatus("loading")
    setLoadMoreFailed(false)
    void load(undefined, false)
  }, [load])

  return { items, setItems, nextCursor, status, loadMoreFailed, loadMore, reload }
}
