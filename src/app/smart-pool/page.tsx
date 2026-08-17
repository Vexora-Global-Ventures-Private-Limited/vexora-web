"use client"

import { Sparkles } from "lucide-react"
import { ComingSoonPage } from "@/components/pages/coming-soon-page"

export default function SmartPoolPage() {
  return (
    <ComingSoonPage
      icon={Sparkles}
      title="Smart Pool"
      audience="For developers, investors and banks"
      description="AI-driven matchmaking that pairs developer projects with the right investors and lending partners — automatically, based on fit rather than cold outreach."
    />
  )
}
