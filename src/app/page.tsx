import { SiteHeader } from "@/components/sections/site-header"
import { Hero } from "@/components/sections/hero"
import { TrustStrip } from "@/components/sections/trust-strip"
import { FeaturedProperties } from "@/components/sections/featured-properties"
import { PropertyTypes } from "@/components/sections/property-types"
import { PopularCities } from "@/components/sections/popular-cities"
import { FeaturedDevelopers } from "@/components/sections/featured-developers"
import { Testimonials } from "@/components/sections/testimonials"
import { CTASection } from "@/components/sections/cta-section"
import { SiteFooter } from "@/components/sections/site-footer"

import { ScrollProgress } from "@/components/motion/scroll-progress"
import { FilmGrain } from "@/components/motion/film-grain"
import { ConciergeFab } from "@/components/motion/concierge-fab"
import { HomeBannerAdSlot } from "@/components/ads/home-banner-ad-slot"
import { ProjectPromotionAdSlot } from "@/components/ads/project-promotion-ad-slot"
import { WelcomeAdsModal } from "@/components/ads/welcome-ads-modal"

export default function Home() {
  return (
    <>
      <ScrollProgress />
      <FilmGrain />
      <WelcomeAdsModal />
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <HomeBannerAdSlot />
        <TrustStrip />
        <FeaturedProperties />
        <PropertyTypes />
        <ProjectPromotionAdSlot />
        <PopularCities />
        <FeaturedDevelopers />
        <Testimonials />
        <CTASection />
      </main>
      <SiteFooter />
      <ConciergeFab />
    </>
  )
}
