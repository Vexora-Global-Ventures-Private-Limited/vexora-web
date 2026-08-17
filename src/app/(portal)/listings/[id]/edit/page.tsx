import { EditListingPage } from "@/components/pages/edit-listing-page"

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <EditListingPage listingId={id} />
}
