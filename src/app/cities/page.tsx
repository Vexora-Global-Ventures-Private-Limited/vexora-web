import type { Metadata } from "next"
import { CitiesPage } from "@/components/pages/cities-page"

export const metadata: Metadata = {
  title: "Explore VXP by City — Properties & Developer Projects Across India",
  description: "Browse verified properties and developer projects across Mumbai, Thane, Pune, Bengaluru, Hyderabad and Delhi NCR on VXP.",
}

export default function Page() {
  return <CitiesPage />
}
