"use client"

import { useEffect, useId, useState } from "react"
import { CheckCircle2 } from "lucide-react"
import { useRequestOtpMutation, useVerifyOtpMutation, type OtpChannel } from "@/store/api/authApi"
import { useLoadSession } from "@/hooks/use-auth"
import { getApiErrorCode, getApiErrorMessage } from "@/lib/api-error"
import { cn } from "@/lib/utils"
import { isValidEmail, isValidIndianMobile } from "@/lib/profile-options"

/**
 * Email and mobile aren't profile fields — they belong to the account and
 * are only added through an OTP round-trip (POST /auth/otp/request with
 * purpose "email_verify" / "mobile_verify" + a Bearer token, then
 * /auth/otp/verify). That verify call returns { verified, channel,
 * destination } — no new tokens — so on success the session is just
 * reloaded to pick the new contact up.
 *
 * The backend doesn't validate the email format on request (verified live
 * 2026-10-24), so it's checked here before sending — as is the Indian
 * mobile format (10 digits, starting 6–9).
 */
export function VerifyContactField({
  channel,
  value,
  label,
  inputClass,
  labelClass,
}: {
  channel: OtpChannel
  /** The already-verified value on the account, if any. */
  value?: string
  label: string
  inputClass: string
  labelClass: string
}) {
  const [requestOtp, { isLoading: isRequesting }] = useRequestOtpMutation()
  const [verifyOtp, { isLoading: isVerifying }] = useVerifyOtpMutation()
  const loadSession = useLoadSession()
  const [draft, setDraft] = useState("")
  const [otpId, setOtpId] = useState<string | null>(null)
  const [code, setCode] = useState("")
  const [cooldown, setCooldown] = useState(0)
  const [error, setError] = useState<string | null>(null)
  // The destination that was just verified. Shown as verified straight away,
  // even if the follow-up session reload fails — otherwise the field would
  // silently fall back to an empty input after a successful verification.
  const [verifiedValue, setVerifiedValue] = useState<string | null>(null)
  const inputId = useId()

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  const shownValue = value || verifiedValue
  if (shownValue) {
    return (
      <div>
        <label htmlFor={inputId} className={labelClass}>{label}</label>
        <div className="relative">
          <input id={inputId} value={shownValue} disabled className={cn(inputClass, "pr-24")} />
          <span className="absolute right-2 top-1/2 mt-[3px] flex -translate-y-1/2 items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-emerald-600">
            <CheckCircle2 className="h-3.5 w-3.5" /> {verifiedValue && !value ? "Added" : "Verified"}
          </span>
        </div>
      </div>
    )
  }

  const destination = channel === "mobile" ? `+91${draft}` : draft.trim()
  const draftValid = channel === "mobile" ? isValidIndianMobile(draft) : isValidEmail(draft)
  const formatHint =
    draft && !draftValid
      ? channel === "mobile"
        ? "Enter a 10-digit Indian mobile number starting with 6, 7, 8 or 9."
        : "Enter a valid email address."
      : null

  const sendCode = async () => {
    if (!draftValid || cooldown > 0) return
    setError(null)
    try {
      const res = await requestOtp({
        destination,
        channel,
        purpose: channel === "mobile" ? "mobile_verify" : "email_verify",
      }).unwrap()
      // Always verify against the newest otpId — a resend invalidates the old one.
      setOtpId(res.data.otpId)
      setCode("")
      setCooldown(30)
    } catch (err) {
      setError(
        getApiErrorCode(err) === "RATE_LIMITED"
          ? "Too many codes requested — please wait a few minutes and try again."
          : getApiErrorMessage(err) ?? "Couldn't send the code. Please try again.",
      )
    }
  }

  const confirmCode = async () => {
    if (!otpId || code.length !== 6) return
    setError(null)
    try {
      await verifyOtp({ otpId, code }).unwrap()
      setVerifiedValue(destination)
      setOtpId(null)
      await loadSession().catch(() => {})
    } catch (err) {
      const errCode = getApiErrorCode(err)
      if (errCode === "CONTACT_IN_USE") {
        setError(`This ${channel === "mobile" ? "number" : "email"} is already linked to another account.`)
        setOtpId(null)
      } else if (errCode === "OTP_EXPIRED" || errCode === "OTP_MAX_ATTEMPTS" || errCode === "OTP_NOT_FOUND") {
        setError("That code can't be used any more — request a new one.")
        setOtpId(null)
      } else {
        // OTP_INVALID's message already carries "N attempts remaining".
        setError(getApiErrorMessage(err) ?? "That code didn't match. Please try again.")
      }
    }
  }

  return (
    <div>
      <label htmlFor={inputId} className={labelClass}>{label}</label>
      {!otpId ? (
        <div className="flex gap-2">
          <div className={cn(inputClass, "flex items-center gap-1 focus-within:border-brand-primary")}>
            {channel === "mobile" && <span className="text-brand-muted-foreground">+91</span>}
            <input
              id={inputId}
              value={draft}
              onChange={(e) =>
                setDraft(channel === "mobile" ? e.target.value.replace(/\D/g, "").slice(0, 10) : e.target.value)
              }
              onKeyDown={(e) => e.key === "Enter" && sendCode()}
              inputMode={channel === "mobile" ? "numeric" : "email"}
              placeholder={channel === "mobile" ? "98765 43210" : "you@email.com"}
              className="w-full bg-transparent outline-none"
            />
          </div>
          <button
            type="button"
            onClick={sendCode}
            disabled={!draftValid || isRequesting || cooldown > 0}
            className="mt-1.5 shrink-0 border border-brand-primary px-3 text-xs font-bold text-brand-secondary hover:bg-brand-primary/10 disabled:opacity-50"
          >
            {isRequesting ? "Sending…" : cooldown > 0 ? `Resend in ${cooldown}s` : "Verify"}
          </button>
        </div>
      ) : (
        <>
          <p className="mt-1.5 text-[11px] text-brand-muted-foreground">
            Enter the 6-digit code sent to <b>{destination}</b>.{" "}
            <button type="button" onClick={() => setOtpId(null)} className="underline">
              Change
            </button>
          </p>
          <div className="flex gap-2">
            <input
              id={inputId}
              aria-label={`${label} verification code`}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              onKeyDown={(e) => e.key === "Enter" && confirmCode()}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="••••••"
              className={cn(inputClass, "tracking-[0.4em]")}
            />
            <button
              type="button"
              onClick={confirmCode}
              disabled={code.length !== 6 || isVerifying}
              className="btn-gold relative mt-1.5 shrink-0 overflow-hidden px-3 text-xs font-bold disabled:opacity-60"
            >
              <span className="relative z-10">{isVerifying ? "Checking…" : "Confirm"}</span>
            </button>
          </div>
          <button
            type="button"
            onClick={sendCode}
            disabled={cooldown > 0 || isRequesting}
            className="mt-1 text-[11px] font-semibold text-brand-secondary/60 hover:text-brand-secondary disabled:opacity-50"
          >
            {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
          </button>
        </>
      )}
      {!otpId && formatHint && <p className="mt-1 text-[11px] text-brand-muted-foreground">{formatHint}</p>}
      {error && <p className="mt-1 text-[11px] font-semibold text-red-500">{error}</p>}
    </div>
  )
}
