"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, BadgeCheck, Clock, Loader2, ShieldCheck, X, XCircle } from "lucide-react"
import { ROUTES } from "@/lib/routes"
import { isUnsignedUploadConfigured } from "@/lib/cloudinary"
import { getApiErrorCode, getApiErrorMessage } from "@/lib/api-error"
import { ImageUploadButton } from "@/components/site/image-upload-button"
import { useGetPublicConfigQuery } from "@/store/api/searchApi"
import { BADGE_LABEL, KYC_DOCUMENT_LABEL, useGetKycStatusQuery, useSubmitKycMutation, type KycStatus } from "@/store/api/kycApi"
import { cn } from "@/lib/utils"

const docLabel = (type: string) => KYC_DOCUMENT_LABEL[type] ?? type.toUpperCase()

/**
 * KYC → trust badge (GET /kyc/status, POST /kyc/submissions). Members only:
 * the backend answers 403 KYC_MEMBERS_ONLY for Free Users. The backend
 * picks the badge a submission is for (Verified first; Verified Developer
 * for Venus members who are already Verified) and says which documents are
 * missing (422 KYC_DOCUMENTS_INCOMPLETE), so the form doesn't hard-code that.
 */
export function VerificationTab({ isPaidMember }: { isPaidMember: boolean }) {
  const { data: status, isLoading, isError, refetch } = useGetKycStatusQuery(undefined, { refetchOnMountOrArgChange: true })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl font-bold text-brand-secondary">Verification</h2>
        <p className="text-sm text-brand-muted-foreground">
          Verify your identity to earn a trust badge on your profile and listings.
        </p>
      </div>

      {isLoading ? (
        <p className="flex items-center gap-2 text-sm text-brand-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading your verification status…
        </p>
      ) : isError || !status ? (
        <p className="text-sm text-brand-muted-foreground">
          Couldn&apos;t load your verification status.{" "}
          <button onClick={() => refetch()} className="font-bold underline">Retry</button>
        </p>
      ) : (
        <>
          <StatusCard status={status} />
          {canSubmit(status) &&
            (isPaidMember ? <SubmitCard developer={status.canApplyForDeveloperBadge} /> : <MembersOnlyCard />)}
        </>
      )}
    </div>
  )
}

/** Nothing to submit while one is under review, or once fully verified. */
function canSubmit(status: KycStatus) {
  if (status.status === "submitted") return false
  if (status.currentBadge === "verified_developer") return false
  if (status.currentBadge === "verified") return status.canApplyForDeveloperBadge
  return true
}

function StatusCard({ status }: { status: KycStatus }) {
  const badge = status.currentBadge ? (BADGE_LABEL[status.currentBadge] ?? status.currentBadge) : null
  const submittedOn = status.submittedAt ? new Date(status.submittedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : null

  return (
    <div className="card-sheen bg-card p-6">
      <div className="flex items-start gap-3">
        {badge ? (
          <BadgeCheck className="h-8 w-8 shrink-0 text-brand-primary-dark" />
        ) : status.status === "submitted" ? (
          <Clock className="h-8 w-8 shrink-0 text-brand-primary-dark" />
        ) : status.status === "rejected" ? (
          <XCircle className="h-8 w-8 shrink-0 text-red-500" />
        ) : (
          <ShieldCheck className="h-8 w-8 shrink-0 text-brand-secondary/40" />
        )}
        <div>
          <h3 className="font-serif text-lg font-bold text-brand-secondary">
            {badge ? `You're ${badge}` : status.status === "submitted" ? "Under review" : status.status === "rejected" ? "Verification not approved" : "Not verified yet"}
          </h3>
          <p className="mt-1 text-sm text-brand-muted-foreground">
            {status.status === "submitted"
              ? `We received your documents${submittedOn ? ` on ${submittedOn}` : ""}. Our team will review them — you'll get a notification when it's done.`
              : status.status === "rejected"
                ? "Please fix the issue below and submit again."
                : badge
                  ? status.canApplyForDeveloperBadge
                    ? "The badge shows on your profile and listings. As a Venus member you can also apply for Verified Developer."
                    : "The badge shows on your profile and listings."
                  : "Submit your ID documents to get the Verified badge."}
          </p>
          {status.status === "rejected" && status.rejectionReason && (
            <p className="mt-2 border border-red-200 bg-red-50 p-2 text-xs text-red-700">Reason: {status.rejectionReason}</p>
          )}
          {status.requiredForTier && !badge && (
            <p className="mt-2 text-xs font-semibold text-brand-primary-dark">Your plan requires verification before your listings can be submitted.</p>
          )}
        </div>
      </div>
    </div>
  )
}

function MembersOnlyCard() {
  const router = useRouter()
  return (
    <div className="border border-brand-primary/30 bg-brand-primary/10 p-6 text-sm text-brand-secondary">
      Verification is for paid members.
      <button onClick={() => router.push(ROUTES.membership)} className="ml-2 font-bold text-brand-primary-dark underline">
        See membership plans
      </button>
    </div>
  )
}

function SubmitCard({ developer }: { developer: boolean }) {
  const { data: config } = useGetPublicConfigQuery()
  const types = config?.allowedKycDocumentTypes ?? ["pan", "aadhaar", "cin", "gst"]
  const [docs, setDocs] = useState<Record<string, string>>({})
  const [submit, submitState] = useSubmitKycMutation()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const uploads = isUnsignedUploadConfigured()
  const chosen = Object.entries(docs)

  const send = async () => {
    setError(null)
    try {
      await submit(chosen.map(([type, url]) => ({ type, cloudinaryPublicId: url }))).unwrap()
      setDocs({})
    } catch (err) {
      const code = getApiErrorCode(err)
      if (code === "KYC_MEMBERS_ONLY") setError("Verification is for paid members — upgrade your plan first.")
      else if (code === "KYC_ALREADY_FULLY_VERIFIED") setError("You already have every badge available.")
      else setError(getApiErrorMessage(err) ?? "Couldn't submit your documents. Please try again.")
    }
  }

  return (
    <div className="bg-card p-6 ring-1 ring-brand-border">
      <h3 className="font-serif text-lg font-bold text-brand-secondary">
        {developer ? "Apply for Verified Developer" : "Submit your documents"}
      </h3>
      <p className="mt-1 text-sm text-brand-muted-foreground">
        {developer
          ? "Upload your company documents (e.g. CIN and GST). Clear photos or scans, all four corners visible."
          : "Upload your ID documents (e.g. PAN and Aadhaar). Clear photos, all four corners visible. We'll tell you if anything is missing."}
      </p>

      {/* Requested wording: the dev-only risk must be stated wherever KYC uploads happen. */}
      <div role="alert" className="mt-4 flex gap-2 border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <p>
          <b>Dev only — use test documents, never real ones.</b> Uploads currently go to a public Cloudinary folder: every uploaded
          file is a PUBLIC link — anyone with the URL can see someone&apos;s Aadhaar. A private upload is needed before real users.
        </p>
      </div>

      {!uploads && <p className="mt-4 text-sm text-red-600">Document upload isn&apos;t configured on this site.</p>}

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {types.map((type) => {
          const url = docs[type]
          return (
            <div key={type} className={cn("border p-3", url ? "border-brand-primary" : "border-brand-border")}>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-brand-muted-foreground">{docLabel(type)}</div>
              {url ? (
                <div className="relative mt-2">
                  <img src={url} alt={docLabel(type)} referrerPolicy="no-referrer" className="h-28 w-full bg-brand-surface object-contain" />
                  <button
                    type="button"
                    onClick={() => setDocs(({ [type]: _removed, ...rest }) => rest)}
                    aria-label={`Remove ${docLabel(type)}`}
                    className="absolute right-1 top-1 grid h-6 w-6 place-items-center bg-ink-black/80 text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                uploads && (
                  <ImageUploadButton
                    folder="kyc"
                    label={`Upload ${docLabel(type)}`}
                    disabled={submitState.isLoading}
                    onUploaded={([u]) => setDocs((d) => ({ ...d, [type]: u }))}
                    className="mt-2"
                  />
                )
              )}
            </div>
          )
        })}
      </div>

      {error && (
        <p role="alert" className="mt-4 text-sm font-semibold text-red-600">
          {error}
          {getApiErrorCode(submitState.error) === "KYC_MEMBERS_ONLY" && (
            <button onClick={() => router.push(ROUTES.membership)} className="ml-2 underline">See plans</button>
          )}
        </p>
      )}

      <button
        onClick={() => void send()}
        disabled={chosen.length === 0 || submitState.isLoading}
        className="btn-gold relative mt-5 overflow-hidden px-6 py-2.5 text-sm font-bold disabled:opacity-50"
      >
        <span className="relative z-10">
          {submitState.isLoading ? "Submitting…" : `Submit ${chosen.length || ""} document${chosen.length === 1 ? "" : "s"} for review`}
        </span>
      </button>
    </div>
  )
}
