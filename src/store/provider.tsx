"use client"

import type { ReactNode } from "react"
import { Provider } from "react-redux"
import { GoogleOAuthProvider } from "@react-oauth/google"
import { store } from "./store"

const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

export function ReduxProvider({ children }: { children: ReactNode }) {
  // Always mount GoogleOAuthProvider (even with an empty clientId) so that
  // useGoogleLogin() always has its required context and never throws at
  // render time — an unconfigured client ID only surfaces as an error when a
  // sign-in is actually attempted, handled in useGoogleAuth().
  return (
    <Provider store={store}>
      <GoogleOAuthProvider clientId={googleClientId ?? ""}>{children}</GoogleOAuthProvider>
    </Provider>
  )
}
