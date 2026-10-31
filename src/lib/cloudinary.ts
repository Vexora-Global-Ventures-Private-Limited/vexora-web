"use client"

import type { UploadTicket } from "@/store/api/listingsApi"

/**
 * Direct browser → Cloudinary image uploads. The file never passes through
 * our API; Cloudinary returns a `secure_url`, and that URL is what gets
 * saved on the backend (listing media, avatar, builder logo, ad creative)
 * — exactly like a pasted link.
 *
 * Two ways to authorise an upload, in order of preference:
 *  1. A signed ticket from the backend (POST /listings/media/sign — listing
 *     photos only). Returns null until the backend has Cloudinary
 *     credentials; the API secret only ever lives on the backend.
 *  2. An unsigned upload preset — NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME +
 *     NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET. Both are public by design. Lock
 *     the preset down in the Cloudinary console (allowed formats, max file
 *     size, fixed folder), since anyone holding it can upload.
 * With neither, uploads are unavailable and screens fall back to pasting a link.
 */

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? ""
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? ""

export const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp"
const ALLOWED_TYPES = IMAGE_ACCEPT.split(",")
// Originals up to 25 MB are accepted — they're shrunk before upload, well
// under Cloudinary's 10 MB free-plan cap.
export const MAX_IMAGE_BYTES = 25 * 1024 * 1024
const UPLOAD_CAP_BYTES = 10 * 1024 * 1024

// Phone photos are 3–10 MB; resized to this long edge as JPEG they're
// ~300–600 KB with no visible loss on any screen we render.
const MAX_EDGE_PX = 2560
const JPEG_QUALITY = 0.85
// Already small enough — upload as-is.
const SKIP_COMPRESS_BYTES = 500 * 1024
const PNG_KEEP_BYTES = 2 * 1024 * 1024

// "kyc": ⚠ DEV ONLY — the unsigned preset makes every uploaded file a PUBLIC
// link: anyone with the URL can see someone's Aadhaar. Real KYC needs a
// private/signed upload from the backend (UNRESOLVED-ISSUES #66).
export type UploadFolder = "listings" | "avatars" | "builders" | "ads" | "kyc"

/** True when uploads can work without a backend ticket (unsigned preset configured). */
export function isUnsignedUploadConfigured(): boolean {
  return !!CLOUD_NAME && !!UPLOAD_PRESET
}

/** Client-side check before uploading — returns a message, or null when the file is fine. */
export function validateImageFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) return `"${file.name}" isn't a JPG, PNG or WebP image.`
  if (file.size > MAX_IMAGE_BYTES) return `"${file.name}" is over 25 MB.`
  return null
}

/**
 * Shrink a photo before upload: long edge ≤ 2560 px, re-encoded as JPEG.
 * Falls back to the original if the browser can't decode it or the result
 * isn't smaller. createImageBitmap applies EXIF orientation, so phone
 * photos stay upright.
 */
async function compressImage(file: File): Promise<Blob> {
  // Small PNGs are usually logos with transparency, which JPEG would lose.
  if (file.size <= SKIP_COMPRESS_BYTES || (file.type === "image/png" && file.size <= PNG_KEEP_BYTES)) return file
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" })
    const scale = Math.min(1, MAX_EDGE_PX / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement("canvas")
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    const ctx = canvas.getContext("2d")
    if (!ctx) return file
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY))
    return blob && blob.size < file.size ? blob : file
  } catch {
    return file
  }
}

/**
 * Upload one image (shrunk first — see compressImage). Resolves with
 * Cloudinary's https URL. `ticket` (from the backend) wins over the
 * unsigned preset. `onProgress` gets 0–1.
 */
export function uploadImage(
  file: File,
  { folder, ticket, onProgress }: { folder: UploadFolder; ticket?: UploadTicket | null; onProgress?: (fraction: number) => void },
): Promise<string> {
  const invalid = validateImageFile(file)
  if (invalid) return Promise.reject(new Error(invalid))
  return compressImage(file).then((blob) => send(file.name, blob, folder, ticket, onProgress))
}

function send(
  name: string,
  blob: Blob,
  folder: UploadFolder,
  ticket: UploadTicket | null | undefined,
  onProgress: ((fraction: number) => void) | undefined,
): Promise<string> {
  if (blob.size > UPLOAD_CAP_BYTES) return Promise.reject(new Error(`"${name}" is still over 10 MB — try a smaller photo.`))

  const body = new FormData()
  body.append("file", blob, name)
  let cloudName: string
  if (ticket) {
    cloudName = ticket.cloud_name
    body.append("api_key", ticket.api_key)
    body.append("timestamp", String(ticket.timestamp))
    body.append("signature", ticket.signature)
    // Signed params must match exactly what the backend signed.
    if (ticket.folder) body.append("folder", ticket.folder)
  } else if (isUnsignedUploadConfigured()) {
    cloudName = CLOUD_NAME
    body.append("upload_preset", UPLOAD_PRESET)
    body.append("folder", `vxp/${folder}`)
  } else {
    return Promise.reject(new Error("Photo uploads aren't set up yet — paste an image link instead."))
  }

  // XHR rather than fetch: fetch has no upload progress.
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`)
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(e.loaded / e.total)
    }
    xhr.onload = () => {
      let res: { secure_url?: string; error?: { message?: string } } = {}
      try {
        res = JSON.parse(xhr.responseText)
      } catch {
        // Non-JSON error page — handled below.
      }
      if (xhr.status >= 200 && xhr.status < 300 && res.secure_url) resolve(res.secure_url)
      else reject(new Error(res.error?.message ? `Upload failed: ${res.error.message}` : "Upload failed. Please try again."))
    }
    xhr.onerror = () => reject(new Error("Upload failed — check your connection and try again."))
    xhr.send(body)
  })
}
