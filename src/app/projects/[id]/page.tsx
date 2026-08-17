import { ProjectDetailPage } from "@/components/pages/project-detail-page"

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ProjectDetailPage projectId={id} />
}
