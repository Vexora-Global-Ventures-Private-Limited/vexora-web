import type { Metadata } from "next"
import { Geist, Geist_Mono, Inter, JetBrains_Mono, Playfair_Display, Space_Grotesk } from "next/font/google"
import "./globals.css"
import { BRAND_COLORS_INIT_SCRIPT } from "@/lib/apply-brand-colors"
import { ReduxProvider } from "@/store/provider"
import { ThemeProvider } from "@/components/theme-provider"
import { BrandColorProvider } from "@/components/settings/brand-color-provider"
import { SessionHydrator } from "@/components/site/session-hydrator"
import { Preloader } from "@/components/motion/preloader"
import { SmoothScroll } from "@/components/motion/smooth-scroll"
import { SiteChrome } from "@/components/site/site-chrome"
import { TopProgressBar } from "@/components/site/top-progress-bar"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
})

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
})

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
})

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "VXP — India's Elite Real Estate Marketplace & Lead Platform",
  description:
    "VXP is India's premium real estate marketplace for elite buyers, brokers, developers and investors. Verified luxury listings, sponsored placements, CRM-powered lead management, and three membership tiers — Mercury, Jupiter & Venus.",
  keywords: [
    "VXP",
    "India real estate",
    "luxury properties India",
    "Mumbai real estate",
    "Thane properties",
    "Lodha",
    "Runwal",
    "Godrej Properties",
    "Sobha",
    "Prestige",
    "real estate CRM",
    "lead management",
    "property advertisement",
    "broker platform",
  ],
  authors: [{ name: "VXP" }],
  // The site ships its own light/dark theme. Without this, the Dark Reader
  // extension rewrites inline styles before React hydrates and every page
  // logs a hydration-mismatch error in dev.
  other: { "darkreader-lock": "true" },
  openGraph: {
    title: "VXP — India's Elite Real Estate Marketplace",
    description: "Verified luxury listings, sponsored placements, and CRM-powered lead management for India's elite.",
    siteName: "VXP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "VXP — India's Elite Real Estate Marketplace",
    description: "Verified luxury listings, sponsored placements, and CRM-powered lead management for India's elite.",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} ${inter.variable} ${jetbrainsMono.variable} ${spaceGrotesk.variable} antialiased bg-brand-tertiary text-brand-secondary min-h-screen flex flex-col font-sans`}
      >
        <ReduxProvider>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
            <script dangerouslySetInnerHTML={{ __html: BRAND_COLORS_INIT_SCRIPT }} />
            <BrandColorProvider>
              <SessionHydrator />
              <Preloader />
              <TopProgressBar active />
              <SiteChrome />
              <SmoothScroll>{children}</SmoothScroll>
            </BrandColorProvider>
          </ThemeProvider>
        </ReduxProvider>
      </body>
    </html>
  )
}
