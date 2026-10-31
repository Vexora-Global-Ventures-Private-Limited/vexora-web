"use client"

import { useMemo, useState } from "react"
import { isUnsignedUploadConfigured } from "@/lib/cloudinary"
import { rememberAdCreative } from "@/lib/ad-creatives"
import { ImageUploadButton } from "@/components/site/image-upload-button"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeft, ArrowRight, Check, LayoutPanelTop, Building2, Play, Crown,
  Wallet, ShieldCheck, Upload, Target, AlertCircle,
} from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { ROUTES } from "@/lib/routes"
import { useNav } from "@/lib/nav-store"
import { formatPaise } from "@/lib/api-mappers"
import { getApiErrorMessage } from "@/lib/api-error"
import { useCheckout, usePendingOrder, adPendingKey } from "@/hooks/use-checkout"
import { CheckoutStatus } from "@/components/billing/checkout-status"
import {
  useActivateAdvertiserMutation,
  useCreateAdMutation,
  useSetAdCreativeMutation,
  useSetAdPackageMutation,
  usePayForAdMutation,
  useGetAdPackagesQuery,
  latestActivePackages,
  useGetAdQuery,
  type Ad,
  type AdProduct,
} from "@/store/api/adsApi"
import { useGetMyListingsQuery, useGetMyBuilderProfileQuery } from "@/store/api/listingsApi"
import { useGetActiveLocationsQuery } from "@/store/api/searchApi"

type ProductInfo = {
  product: AdProduct
  name: string
  icon: React.ComponentType<{ className?: string }>
  placement: string
  /** Who can buy it (enforced server-side — this is just the label). */
  eligibility: string
  needsCreative: boolean
}

// The 4 real ad products (08-Backend.md §4.4). "City Advertisement" from the
// prototype isn't a product — a banner with a targetCity is.
const PRODUCTS: ProductInfo[] = [
  { product: "banner", name: "Home Banner", icon: LayoutPanelTop, placement: "Homepage banner slot, optionally targeted to one city", eligibility: "Any account", needsCreative: true },
  { product: "sponsored", name: "Sponsored Listing", icon: Crown, placement: "Top of search results for one of your live listings", eligibility: "Active membership", needsCreative: false },
  { product: "featured", name: "Featured Developer", icon: Building2, placement: "Featured Developers row on the homepage", eligibility: "Jupiter / Venus with a builder profile", needsCreative: false },
  { product: "project_promotion", name: "Project Promotion", icon: Play, placement: "Rich-media landing page for one project", eligibility: "Venus with a project", needsCreative: true },
]

const steps = [
  { id: 1, label: "Ad type", icon: LayoutPanelTop },
  { id: 2, label: "Target", icon: Target },
  { id: 3, label: "Creative", icon: Upload },
  { id: 4, label: "Package", icon: Wallet },
  { id: 5, label: "Pay", icon: ShieldCheck },
]

const inputClass =
  "mt-1 w-full border border-brand-border-light bg-card px-3 py-2.5 text-sm outline-none focus:border-brand-primary aria-[invalid=true]:border-red-400"
const labelClass = "text-[11px] font-semibold uppercase tracking-wide text-brand-secondary/55"

/**
 * https-only URL check. The backend stores any string as a creative or
 * click-through target — it accepted "not a url" and "javascript:alert(1)"
 * (verified live 2026-10-24) — so this is the only gate. https only, so a
 * creative never triggers mixed-content blocking on the https site.
 */
export function isHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value.trim())
    return url.protocol === "https:" && !!url.hostname.includes(".")
  } catch {
    return false
  }
}

const isObjectId = (v: string) => /^[a-f0-9]{24}$/i.test(v.trim())

/** Which step a resumed draft lands on, from what it already has. */
function resumeStep(ad: Ad, needsCreative: boolean): number {
  if (ad.amountPaise || ad.packageId) return 5
  // GET /ads/:id doesn't return creatives, so a creative-product draft
  // without a package re-opens the creative step (re-saving is harmless).
  return needsCreative ? 3 : 4
}

/**
 * Real ad funnel (BR-62): accept advertiser terms (one-time) → POST /ads →
 * creative (banner / project_promotion only) → pick a package (price is
 * snapshotted) → pay via the shared async checkout. A paid ad always goes
 * to admin review — never straight live.
 */
export function PromotePage() {
  // ?ad=<id> resumes an unpaid draft from the advertiser dashboard. Mounted
  // only once that draft has loaded, so the funnel's state seeds from it.
  const resumeId = useSearchParams().get("ad")
  const { data: resumeAd, isError: resumeFailed } = useGetAdQuery(resumeId ?? "", { skip: !resumeId })
  const router = useRouter()

  if (resumeId && !resumeAd && !resumeFailed) {
    return <div className="min-h-screen bg-brand-surface p-10 text-center text-sm text-brand-secondary/55">Loading your draft…</div>
  }
  if (resumeId && resumeFailed) {
    return (
      <div className="min-h-screen bg-brand-surface p-10 text-center text-sm text-brand-secondary/70">
        Couldn&apos;t load that draft.{" "}
        <button onClick={() => router.replace(ROUTES.promote)} className="font-bold text-brand-primary-dark underline">
          Start a new ad
        </button>
      </div>
    )
  }
  return <PromoteFunnel key={resumeAd?._id ?? "new"} resume={resumeAd && resumeAd.status === "draft" ? resumeAd : null} />
}

function PromoteFunnel({ resume }: { resume: Ad | null }) {
  const router = useRouter()
  const user = useNav((s) => s.user)
  const resumeInfo = resume ? PRODUCTS.find((p) => p.product === resume.product) : undefined
  const [step, setStep] = useState(resume && resumeInfo ? resumeStep(resume, resumeInfo.needsCreative) : 1)
  const [product, setProduct] = useState<AdProduct | null>(resume?.product ?? null)
  const [ad, setAd] = useState<Ad | null>(resume)
  const [error, setError] = useState<string | null>(null)
  const [imageBroken, setImageBroken] = useState(false)

  // Step 2 inputs
  const [termsAccepted, setTermsAccepted] = useState(!!resume)
  const [targetCity, setTargetCity] = useState(resume?.targetCity ?? "")
  const [listingId, setListingId] = useState(resume?.listingId ?? "")
  const [projectId, setProjectId] = useState(resume?.projectId ?? "")
  // Step 3 inputs
  const [imageUrl, setImageUrl] = useState("")
  const [targetUrl, setTargetUrl] = useState("")
  // Step 4
  const [packageId, setPackageId] = useState<string | null>(resume?.packageId ?? null)

  const info = PRODUCTS.find((p) => p.product === product)
  const [activateAdvertiser, { isLoading: activating }] = useActivateAdvertiserMutation()
  const [createAd, { isLoading: creating }] = useCreateAdMutation()
  const [setCreative, { isLoading: savingCreative }] = useSetAdCreativeMutation()
  const [setPackage, { isLoading: savingPackage }] = useSetAdPackageMutation()
  const [payForAd] = usePayForAdMutation()
  // Remembers a still-confirming payment per ad, so the dashboard doesn't
  // call a paid ad an "unpaid draft" (an ad stays "draft" until capture).
  const checkout = useCheckout({ pendingKey: ad ? adPendingKey(ad._id) : undefined })
  // A payment for this ad from an earlier visit that's still confirming —
  // re-check it instead of offering "Pay" again (a new attempt = a new order).
  const earlierOrder = usePendingOrder(ad ? adPendingKey(ad._id) : undefined)

  const { data: liveListings } = useGetMyListingsQuery({ status: "live", limit: 50 }, { skip: product !== "sponsored" })
  const { data: builderProfile } = useGetMyBuilderProfileQuery(undefined, { skip: product !== "project_promotion" })
  const { data: locations } = useGetActiveLocationsQuery(undefined, { skip: product !== "banner" })
  const { data: rawPackages, isLoading: packagesLoading } = useGetAdPackagesQuery(product ?? "banner", { skip: !product || step < 4 })
  // Newest active version of each package only — see latestActivePackages.
  const packages = useMemo(() => latestActivePackages(rawPackages), [rawPackages])
  const cities = useMemo(
    () => Array.from(new Set((locations ?? []).filter((l) => l.type === "city" || l.type === "district").map((l) => l.name))).sort(),
    [locations],
  )
  // Look up the selection in the raw list: a resumed draft may point at an
  // older version that's no longer the one on offer.
  const selectedPackage = rawPackages?.find((p) => p._id === packageId)

  const createDraft = async () => {
    if (!product) return
    setError(null)
    try {
      // Idempotent server-side — safe to send every time terms are ticked.
      await activateAdvertiser().unwrap()
      const created = await createAd({
        product,
        ...(product === "banner" && targetCity ? { targetCity } : {}),
        ...(product === "sponsored" ? { listingId } : {}),
        ...(product === "project_promotion" ? { projectId } : {}),
      }).unwrap()
      setAd(created)
      setStep(info?.needsCreative ? 3 : 4)
    } catch (err) {
      setError(getApiErrorMessage(err) ?? "Couldn't start the ad. Please try again.")
    }
  }

  const saveCreative = async () => {
    if (!ad) return
    setError(null)
    try {
      // The backend stores whatever goes in cloudinaryPublicId and serves it
      // as the image, so the full https URL (uploaded or pasted) goes here.
      await setCreative({
        id: ad._id,
        creatives: [{ mediaType: "image", cloudinaryPublicId: imageUrl.trim(), ...(targetUrl.trim() ? { targetUrl: targetUrl.trim() } : {}) }],
      }).unwrap()
      // The API never returns creatives to the owner — keep it for the dashboard.
      rememberAdCreative(ad._id, { imageUrl: imageUrl.trim(), targetUrl: targetUrl.trim() || null })
      setStep(4)
    } catch (err) {
      setError(getApiErrorMessage(err) ?? "Couldn't save the creative.")
    }
  }

  const savePackage = async () => {
    if (!ad || !packageId) return
    setError(null)
    try {
      const updated = await setPackage({ id: ad._id, packageId }).unwrap()
      setAd(updated)
      setStep(5)
    } catch (err) {
      setError(getApiErrorMessage(err) ?? "Couldn't select that package.")
    }
  }

  const pay = () => {
    if (!ad) return
    void checkout.start((idempotencyKey) => payForAd({ id: ad._id, idempotencyKey }).unwrap())
  }

  const step2Valid =
    termsAccepted &&
    (product === "banner" ||
      product === "featured" ||
      (product === "sponsored" && !!listingId) ||
      (product === "project_promotion" && isObjectId(projectId)))
  const imageOk = isHttpsUrl(imageUrl)
  // A banner must link somewhere — otherwise visitors have nothing to click
  // and the ad can never earn clicks. Optional for project promotion.
  const linkRequired = product === "banner"
  const targetOk = targetUrl.trim() ? isHttpsUrl(targetUrl) : !linkRequired
  const visibleSteps = steps.map((s) => (s.id === 3 && info && !info.needsCreative ? { ...s, label: "Creative (n/a)" } : s))

  return (
    <div className="min-h-screen bg-brand-surface">
      <header className="sticky top-0 z-30 border-b border-brand-border-light bg-card/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <button onClick={() => router.push(ROUTES.advertiser)} className="flex items-center gap-2 text-sm font-bold text-brand-secondary/70 hover:text-brand-secondary">
            <ArrowLeft className="h-4 w-4" /> Advertiser dashboard
          </button>
          <div className="font-serif text-lg font-bold text-brand-secondary">Promote on VXP</div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-10">
        {/* Stepper */}
        <div className="mb-12 flex items-center justify-between">
          {visibleSteps.map((s, i) => (
            <div key={s.id} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-2">
                <motion.div
                  initial={false}
                  animate={{
                    backgroundColor: step >= s.id ? "var(--color-ink-black)" : "var(--card)",
                    color: step >= s.id ? "var(--brand-primary)" : "var(--brand-primary-dark)",
                    scale: step === s.id ? 1.1 : 1,
                  }}
                  aria-label={`Step ${s.id}: ${s.label}${step === s.id ? " (current)" : ""}`}
                  className="grid h-9 w-9 place-items-center border-2 text-sm font-bold sm:h-11 sm:w-11"
                  style={{ borderColor: step >= s.id ? "var(--brand-primary)" : "var(--brand-border-light)" }}
                >
                  {step > s.id ? <Check className="h-4 w-4" /> : <s.icon className="h-4 w-4" />}
                </motion.div>
                <span className={"hidden text-[11px] font-semibold sm:block " + (step >= s.id ? "text-brand-secondary" : "text-brand-secondary/45")}>
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className="mx-1.5 h-px flex-1 bg-brand-border-light sm:mx-3">
                  <motion.div
                    initial={false}
                    animate={{ width: step > s.id ? "100%" : "0%" }}
                    transition={{ duration: 0.5 }}
                    className="h-full bg-gradient-to-r from-brand-primary to-brand-primary-dark"
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-2 border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            {/membership/i.test(error) && (
              <button onClick={() => router.push(ROUTES.membership)} className="ml-auto text-xs font-bold underline">
                View plans
              </button>
            )}
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* STEP 1: product */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.4 }}>
              <h2 className="font-serif text-3xl font-bold text-brand-secondary">Choose your ad type</h2>
              <p className="mt-2 text-sm text-brand-secondary/65">Every ad is reviewed by our team before it goes live.</p>

              <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {PRODUCTS.map((p) => {
                  const selected = product === p.product
                  return (
                    <motion.button
                      key={p.product}
                      onClick={() => setProduct(p.product)}
                      whileHover={{ y: -4 }}
                      className={
                        "flex items-start gap-4 border-2 bg-card p-5 text-left transition-colors " +
                        (selected ? "border-brand-primary bg-brand-surface" : "border-brand-border-light hover:border-brand-primary/40")
                      }
                    >
                      <div className="grid h-12 w-12 shrink-0 place-items-center bg-gradient-to-br from-brand-primary to-brand-primary-dark text-ink-black">
                        <p.icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <span className="font-serif text-base font-bold text-brand-secondary">{p.name}</span>
                        <div className="mt-2 space-y-1 text-[11px] text-brand-secondary/55">
                          <div><b className="text-brand-secondary/75">Placement:</b> {p.placement}</div>
                          <div><b className="text-brand-secondary/75">Who can buy:</b> {p.eligibility}</div>
                        </div>
                      </div>
                      {selected && (
                        <div className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-primary text-white">
                          <Check className="h-3.5 w-3.5" />
                        </div>
                      )}
                    </motion.button>
                  )
                })}
              </div>

              <div className="mt-8 flex justify-end">
                <button disabled={!product} onClick={() => setStep(2)} className="btn-gold relative overflow-hidden px-6 py-3 text-sm font-bold disabled:opacity-50">
                  <span className="relative z-10 flex items-center gap-2">Continue <ArrowRight className="h-4 w-4" /></span>
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: target + terms → creates the draft */}
          {step === 2 && info && (
            <motion.div key="step2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.4 }}>
              <h2 className="font-serif text-3xl font-bold text-brand-secondary">{info.name}: what are you promoting?</h2>

              <div className="mt-8 space-y-5 border border-brand-border-light bg-card p-6">
                {product === "banner" && (
                  <div>
                    <label className={labelClass}>Target city (optional — leave empty for nationwide)</label>
                    <select value={targetCity} onChange={(e) => setTargetCity(e.target.value)} className={inputClass}>
                      <option value="">All of India</option>
                      {cities.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                )}

                {product === "sponsored" && (
                  <div>
                    <label className={labelClass}>Which of your live listings?</label>
                    {liveListings && liveListings.listings.length === 0 ? (
                      <p className="mt-2 text-sm text-brand-secondary/60">
                        You have no live listings yet — a listing must be approved and live before it can be sponsored.{" "}
                        <button onClick={() => router.push(ROUTES.dashboardTab("listings"))} className="font-bold text-brand-primary-dark underline">
                          My listings
                        </button>
                      </p>
                    ) : (
                      <select value={listingId} onChange={(e) => setListingId(e.target.value)} className={inputClass}>
                        <option value="">Select a listing…</option>
                        {liveListings?.listings.map((l) => (
                          <option key={l._id} value={l._id}>{l.title}{l.city ? ` — ${l.city}` : ""}</option>
                        ))}
                      </select>
                    )}
                  </div>
                )}

                {product === "featured" && (
                  <p className="text-sm text-brand-secondary/70">
                    Featured promotes your builder profile — there&apos;s nothing to pick here. You&apos;ll need an active Jupiter or Venus membership and a builder profile.
                  </p>
                )}

                {product === "project_promotion" && (
                  <div>
                    <label className={labelClass}>Which project?</label>
                    {builderProfile?.projects && builderProfile.projects.length > 0 ? (
                      <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className={inputClass}>
                        <option value="">Select a project…</option>
                        {builderProfile.projects.map((p) => (
                          <option key={p._id} value={p._id}>{p.name} — {p.city}</option>
                        ))}
                      </select>
                    ) : (
                      <>
                        <input
                          value={projectId}
                          onChange={(e) => setProjectId(e.target.value.trim())}
                          placeholder="Project ID"
                          aria-label="Project ID"
                          aria-invalid={!!projectId && !isObjectId(projectId)}
                          className={inputClass}
                        />
                        <p className="mt-1 text-[11px] text-brand-secondary/55">
                          {projectId && !isObjectId(projectId)
                            ? "That doesn't look like a project ID — copy it from your project's page."
                            : "Your builder profile has no projects listed here — paste the project's ID."}
                        </p>
                      </>
                    )}
                  </div>
                )}

                <label className="flex cursor-pointer items-start gap-3 border-t border-brand-border-light pt-5 text-sm text-brand-secondary/80">
                  <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} className="mt-0.5 accent-brand-primary" />
                  <span>I accept the VXP advertiser terms. My ad will be reviewed before going live, and can be rejected if it breaks the content guidelines.</span>
                </label>
              </div>

              <div className="mt-8 flex justify-between">
                <button onClick={() => setStep(1)} disabled={!!ad} className="border border-brand-border-light bg-card px-5 py-3 text-sm font-bold text-brand-secondary hover:bg-brand-surface disabled:opacity-40">
                  Back
                </button>
                <button
                  disabled={!step2Valid || creating || activating}
                  onClick={ad ? () => setStep(info.needsCreative ? 3 : 4) : createDraft}
                  className="btn-gold relative overflow-hidden px-6 py-3 text-sm font-bold disabled:opacity-50"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {creating || activating ? "Creating draft…" : "Continue"} <ArrowRight className="h-4 w-4" />
                  </span>
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: creative (banner / project_promotion only) */}
          {step === 3 && info?.needsCreative && (
            <motion.div key="step3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.4 }}>
              <h2 className="font-serif text-3xl font-bold text-brand-secondary">Your ad creative</h2>
              <p className="mt-2 text-sm text-brand-secondary/65">
                {isUnsignedUploadConfigured() ? "Upload your banner image, or paste a hosted image link." : "Paste a hosted image URL — direct uploads arrive once media hosting is connected."}{" "}
                Best results: a <b>wide image, about 1600 × 500 px</b> (3.2 : 1) — it fills the homepage banner edge to edge. Add a
                click-through link, or the banner won&apos;t be clickable and won&apos;t get clicks.
              </p>

              <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1fr]">
                <div className="space-y-4 border border-brand-border-light bg-card p-6">
                  <div>
                    <label htmlFor="ad-image-url" className={labelClass}>Image</label>
                    {isUnsignedUploadConfigured() && (
                      <ImageUploadButton
                        folder="ads"
                        label="Upload image"
                        onUploaded={([url]) => {
                          setImageUrl(url)
                          setImageBroken(false)
                        }}
                        className="mb-2 mt-1.5"
                      />
                    )}
                    <input
                      id="ad-image-url"
                      value={imageUrl}
                      onChange={(e) => {
                        setImageUrl(e.target.value)
                        setImageBroken(false)
                      }}
                      inputMode="url"
                      placeholder="https://…"
                      aria-invalid={!!imageUrl.trim() && !imageOk}
                      className={inputClass}
                    />
                    {imageUrl.trim() && !imageOk && (
                      <p className="mt-1 text-[11px] text-red-500">Must be a full https:// link to an image.</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="ad-target-url" className={labelClass}>
                      Click-through URL {linkRequired ? "*" : "(optional)"}
                    </label>
                    <input
                      id="ad-target-url"
                      value={targetUrl}
                      onChange={(e) => setTargetUrl(e.target.value)}
                      inputMode="url"
                      placeholder="https://your-site.com"
                      aria-invalid={!targetOk}
                      className={inputClass}
                    />
                    {targetUrl.trim() && !isHttpsUrl(targetUrl) ? (
                      <p className="mt-1 text-[11px] text-red-500">Must be a full https:// link.</p>
                    ) : (
                      linkRequired && (
                        <p className="mt-1 text-[11px] text-brand-secondary/55">
                          Where people go when they click your banner — your website, project page or listing.
                        </p>
                      )
                    )}
                  </div>
                </div>
                <div className="grid min-h-48 place-items-center border-2 border-dashed border-brand-border-light bg-card p-2">
                  {imageOk && !imageBroken ? (
                    <img
                      src={imageUrl.trim()}
                      alt="Creative preview"
                      onError={() => setImageBroken(true)}
                      className="max-h-56 w-full object-cover"
                    />
                  ) : (
                    <span className="text-xs text-brand-secondary/50">
                      {imageBroken ? "Couldn't load that image — check the link." : "Preview appears here"}
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  disabled={!imageOk || imageBroken || !targetOk || savingCreative}
                  onClick={saveCreative}
                  className="btn-gold relative overflow-hidden px-6 py-3 text-sm font-bold disabled:opacity-50"
                >
                  <span className="relative z-10 flex items-center gap-2">{savingCreative ? "Saving…" : "Continue"} <ArrowRight className="h-4 w-4" /></span>
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 4: package */}
          {step === 4 && info && (
            <motion.div key="step4" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.4 }}>
              <h2 className="font-serif text-3xl font-bold text-brand-secondary">Select your package</h2>
              <p className="mt-2 text-sm text-brand-secondary/65">The price is locked in the moment you pick it.</p>

              {packagesLoading && <p className="mt-8 text-sm text-brand-secondary/55">Loading packages…</p>}
              {rawPackages && packages.length === 0 && (
                <p className="mt-8 text-sm text-brand-secondary/55">No packages are available for this ad type right now.</p>
              )}
              <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-3">
                {packages.map((pkg) => {
                  const selected = packageId === pkg._id
                  return (
                    <motion.button
                      key={pkg._id}
                      onClick={() => setPackageId(pkg._id)}
                      whileHover={{ y: -6 }}
                      className={
                        "relative flex flex-col border-2 p-6 text-left transition-colors " +
                        (selected ? "border-brand-primary bg-ink-black text-white" : "border-brand-border-light bg-card text-brand-secondary hover:border-brand-primary/40")
                      }
                    >
                      <div className={"font-serif text-xl font-bold " + (selected ? "text-white" : "text-brand-secondary")}>{pkg.name}</div>
                      <div className={"text-xs " + (selected ? "text-white/55" : "text-brand-secondary/55")}>{pkg.durationDays} days</div>
                      <div className={"mt-4 font-serif text-3xl font-bold " + (selected ? "text-brand-primary" : "text-brand-primary-dark")}>{formatPaise(pkg.pricePaise)}</div>
                    </motion.button>
                  )
                })}
              </div>

              <div className="mt-8 flex justify-between">
                <button
                  onClick={() => setStep(info.needsCreative ? 3 : 2)}
                  disabled={savingPackage}
                  className="border border-brand-border-light bg-card px-5 py-3 text-sm font-bold text-brand-secondary hover:bg-brand-surface disabled:opacity-40"
                >
                  Back
                </button>
                <button disabled={!packageId || savingPackage} onClick={savePackage} className="btn-gold relative overflow-hidden px-6 py-3 text-sm font-bold disabled:opacity-50">
                  <span className="relative z-10 flex items-center gap-2">{savingPackage ? "Saving…" : "Continue"} <ArrowRight className="h-4 w-4" /></span>
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 5: pay */}
          {step === 5 && info && ad && (
            <motion.div key="step5" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.4 }}>
              <h2 className="font-serif text-3xl font-bold text-brand-secondary">Review &amp; pay</h2>
              <p className="mt-2 text-sm text-brand-secondary/65">After payment your ad goes to our review team — it goes live only once approved.</p>

              <div className="mt-8 max-w-lg space-y-5 border border-brand-border-light bg-card p-6">
                <div className="space-y-3 text-sm">
                  <Row label="Ad type" value={info.name} />
                  {ad.targetCity && <Row label="City" value={ad.targetCity} />}
                  <Row label="Package" value={selectedPackage ? `${selectedPackage.name} · ${selectedPackage.durationDays} days` : "—"} />
                  <div className="flex justify-between pt-1">
                    <span className="font-serif text-base font-bold text-brand-secondary">Total</span>
                    <span className="font-serif text-xl font-bold text-brand-primary-dark">
                      {formatPaise(ad.amountPaise ?? selectedPackage?.pricePaise)}
                    </span>
                  </div>
                </div>

                <CheckoutStatus
                  phase={checkout.phase}
                  error={checkout.error}
                  successText="Paid — your ad is now waiting for admin review."
                  onRecheck={() => checkout.recheck()}
                  // Same attempt after an error (same idempotency key); a settled
                  // "failed" order already dropped its key, so that's a fresh attempt.
                  onRetry={pay}
                />

                {checkout.phase === "idle" && earlierOrder && (
                  <div role="status" className="border border-brand-primary/30 bg-brand-primary/10 px-4 py-3 text-sm text-brand-secondary">
                    <div className="font-semibold">A payment for this ad is still being confirmed.</div>
                    <p className="mt-1 text-xs text-brand-secondary/70">Don&apos;t pay again — it goes to review once confirmed.</p>
                    <button onClick={() => checkout.recheck(earlierOrder.orderId)} className="mt-2 text-xs font-bold text-brand-primary-dark underline">
                      Check status
                    </button>
                  </div>
                )}
                {checkout.phase === "idle" && !earlierOrder && (
                  <>
                    <button onClick={pay} disabled={!user?.id} className="btn-gold relative w-full overflow-hidden py-3 text-sm font-bold disabled:opacity-50">
                      <span className="relative z-10 flex items-center justify-center gap-2">Pay &amp; submit for approval <Check className="h-4 w-4" /></span>
                    </button>
                    <button onClick={() => setStep(4)} className="w-full text-center text-xs font-semibold text-brand-secondary/60 hover:text-brand-secondary">
                      ← Change package
                    </button>
                    <p className="text-center text-[11px] text-brand-secondary/50">Secure payment by Razorpay.</p>
                  </>
                )}
                {(checkout.phase === "paid" || checkout.phase === "timeout") && (
                  <button onClick={() => router.push(ROUTES.advertiser)} className="w-full bg-ink-black py-3 text-sm font-bold text-brand-primary">
                    Go to advertiser dashboard
                  </button>
                )}
              </div>
              {!user?.id && <p className="mt-4 text-xs text-red-600">Sign in with a real account to buy ads.</p>}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-brand-border-light pb-3">
      <span className="text-brand-secondary/65">{label}</span>
      <span className="font-bold text-brand-secondary">{value}</span>
    </div>
  )
}
