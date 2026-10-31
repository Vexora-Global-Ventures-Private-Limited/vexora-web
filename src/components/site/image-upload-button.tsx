"use client"

import { Loader2, Upload } from "lucide-react"
import { useId, useRef, useState } from "react"
import { IMAGE_ACCEPT, uploadImage, validateImageFile, type UploadFolder } from "@/lib/cloudinary"
import type { UploadTicket } from "@/store/api/listingsApi"
import { cn } from "@/lib/utils"

const UPLOAD_CONCURRENCY = 3

type Props = {
  folder: UploadFolder
  /** Called with the uploaded https URLs (in the order picked). */
  onUploaded: (urls: string[]) => void
  multiple?: boolean
  /** Most files to accept in one pick (multiple only). */
  maxFiles?: number
  /** Fetches a backend-signed ticket per batch; null → the unsigned preset. */
  getTicket?: () => Promise<UploadTicket | null>
  disabled?: boolean
  label?: string
  className?: string
}

/**
 * "Upload from device" for any image field. Uploads straight to Cloudinary
 * (lib/cloudinary.ts) and hands back the URLs — callers save them exactly
 * like a pasted link. Only render it when uploads are available.
 */
export function ImageUploadButton({ folder, onUploaded, multiple, maxFiles, getTicket, disabled, label, className }: Props) {
  const inputId = useId()
  const input = useRef<HTMLInputElement>(null)
  const [progress, setProgress] = useState<{ done: number; total: number; fraction: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFiles = async (list: FileList | null) => {
    const picked = Array.from(list ?? [])
    if (input.current) input.current.value = ""
    if (picked.length === 0) return
    setError(null)
    const files = maxFiles !== undefined ? picked.slice(0, Math.max(0, maxFiles)) : picked
    const skipped = picked.length - files.length
    const invalid = files.map(validateImageFile).find(Boolean)
    if (invalid) return setError(invalid)

    // Up to 3 uploads at once; results keep the order the files were picked.
    const results: (string | undefined)[] = new Array(files.length)
    const fractions = files.map(() => 0)
    const report = () =>
      setProgress({ done: results.filter(Boolean).length, total: files.length, fraction: fractions.reduce((a, b) => a + b, 0) / files.length })
    let firstError: unknown = null
    try {
      const ticket = getTicket ? await getTicket() : null
      report()
      let next = 0
      const worker = async () => {
        while (next < files.length) {
          const i = next++
          try {
            results[i] = await uploadImage(files[i], {
              folder,
              ticket,
              onProgress: (fraction) => {
                fractions[i] = fraction
                report()
              },
            })
          } catch (err) {
            firstError ??= err
          }
          fractions[i] = 1
          report()
        }
      }
      await Promise.all(Array.from({ length: Math.min(UPLOAD_CONCURRENCY, files.length) }, worker))
    } catch (err) {
      firstError ??= err
    } finally {
      setProgress(null)
      // Keep whatever finished, even if some failed.
      const urls = results.filter((u): u is string => !!u)
      if (urls.length > 0) onUploaded(urls)
      if (firstError) {
        const failed = files.length - urls.length
        const reason = firstError instanceof Error ? firstError.message : "Upload failed. Please try again."
        setError(failed > 1 ? `${failed} photos didn't upload. ${reason}` : reason)
      } else if (skipped > 0) {
        setError(`Only the first ${files.length} were uploaded — that's the limit.`)
      }
    }
  }

  const busy = progress !== null
  const percent = progress ? Math.round(progress.fraction * 100) : 0

  return (
    <div className={className}>
      <input
        ref={input}
        id={inputId}
        type="file"
        accept={IMAGE_ACCEPT}
        multiple={multiple}
        className="sr-only"
        disabled={disabled || busy}
        onChange={(e) => void handleFiles(e.target.files)}
      />
      <label
        htmlFor={inputId}
        aria-disabled={disabled || busy}
        className={cn(
          "inline-flex cursor-pointer items-center gap-2 border border-brand-border bg-card px-4 py-2.5 text-xs font-bold text-brand-secondary hover:border-brand-primary",
          (disabled || busy) && "pointer-events-none opacity-60",
        )}
      >
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
        {busy
          ? progress.total > 1
            ? `Uploading ${progress.done} of ${progress.total} done… ${percent}%`
            : `Uploading… ${percent}%`
          : (label ?? (multiple ? "Upload photos" : "Upload photo"))}
      </label>
      <p className="mt-1 text-[11px] text-brand-secondary/50">JPG, PNG or WebP, up to 25 MB{multiple ? " each" : ""} — large photos are resized automatically.</p>
      {error && (
        <p role="alert" className="mt-1 text-xs font-semibold text-red-500">
          {error}
        </p>
      )}
    </div>
  )
}
