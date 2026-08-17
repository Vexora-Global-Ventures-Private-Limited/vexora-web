import { EditProjectPage } from "@/components/pages/edit-project-page"

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <EditProjectPage projectId={id} />
}
