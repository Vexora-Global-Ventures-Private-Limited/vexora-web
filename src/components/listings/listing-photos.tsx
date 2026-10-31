"use client"

import { Loader2, Star, X } from "lucide-react"
import { useState } from "react"
import { getApiErrorMessage } from "@/lib/api-error"
import { useDeleteListingMediaMutation, useGetListingMediaQuery, useReorderListingMediaMutation } from "@/store/api/listingsApi"
import { cn } from "@/lib/utils"
import { PhotoLightbox } from "@/components/site/photo-lightbox"

/**
 * A listing's saved photos, cover first (owner only — see getListingMedia).
 * Click a photo to open it full size in a carousel. `editable` adds
 * remove / make-cover, for drafts.
 */
export function ListingPhotos({
  listingId,
  editable = false,
  title,
  className,
}: {
  listingId: string
  editable?: boolean
  /** Shown in the full-screen viewer's header. */
  title?: string
  className?: string
}) {
  const { data: media, isLoading, isError, refetch } = useGetListingMediaQuery(listingId, { refetchOnMountOrArgChange: true })
  const [deleteMedia, deleteState] = useDeleteListingMediaMutation()
  const [reorder, reorderState] = useReorderListingMediaMutation()
  const [error, setError] = useState<string | null>(null)
  const [viewing, setViewing] = useState<number | null>(null)
  const busy = deleteState.isLoading || reorderState.isLoading

  if (isLoading) {
    return (
      <p className={cn("flex items-center gap-2 text-xs text-brand-muted-foreground", className)}>
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading photos…
      </p>
    )
  }
  if (isError) {
    return (
      <p className={cn("text-xs text-brand-muted-foreground", className)}>
        Couldn&apos;t load the photos.{" "}
        <button onClick={() => refetch()} className="font-bold underline">Retry</button>
      </p>
    )
  }
  if (!media || media.length === 0) {
    return <p className={cn("text-xs text-brand-muted-foreground", className)}>No photos yet.</p>
  }

  const run = async (action: () => Promise<unknown>) => {
    setError(null)
    try {
      await action()
    } catch (err) {
      setError(getApiErrorMessage(err) ?? "That didn't work. Please try again.")
    }
  }

  return (
    <div className={className}>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {media.map((m, i) => (
          <div key={m._id} className="group relative aspect-[4/3] overflow-hidden bg-brand-surface">
            <button
              type="button"
              onClick={() => setViewing(i)}
              aria-label={`View photo ${i + 1} full size`}
              className="block h-full w-full cursor-zoom-in"
            >
              <img src={m.url} alt={`Photo ${i + 1}`} loading="lazy" referrerPolicy="no-referrer" className="h-full w-full object-cover transition-transform duration-300 hover:scale-105" />
            </button>
            {i === 0 && (
              <span className="pointer-events-none absolute left-1.5 top-1.5 bg-ink-black/80 px-1.5 py-0.5 text-[10px] font-bold text-brand-primary">Cover</span>
            )}
            {editable && (
              <div className="absolute right-1.5 top-1.5 flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                {i > 0 && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => run(() => reorder({ id: listingId, order: [m._id, ...media.filter((x) => x._id !== m._id).map((x) => x._id)] }).unwrap())}
                    aria-label={`Make photo ${i + 1} the cover`}
                    title="Make cover"
                    className="grid h-6 w-6 place-items-center bg-ink-black/80 text-brand-primary disabled:opacity-50"
                  >
                    <Star className="h-3 w-3" />
                  </button>
                )}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => run(() => deleteMedia({ id: listingId, mediaId: m._id }).unwrap())}
                  aria-label={`Remove photo ${i + 1}`}
                  title="Remove"
                  className="grid h-6 w-6 place-items-center bg-ink-black/80 text-white disabled:opacity-50"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
      {error && <p className="mt-2 text-xs font-semibold text-red-500">{error}</p>}
      <PhotoLightbox images={media.map((m) => m.url)} index={viewing} onIndexChange={setViewing} onClose={() => setViewing(null)} title={title} />
    </div>
  )
}
