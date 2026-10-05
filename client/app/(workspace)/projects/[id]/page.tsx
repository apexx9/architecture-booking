import ProjectDetail from "@/components/project/project-detail";

/**
 * Next 16 makes `params` a promise, so it is awaited here rather than read
 * synchronously. The page itself stays a thin server shell and the data
 * fetching happens in the client component, matching every other workspace
 * route.
 */
const ProjectDetailPage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;

  return <ProjectDetail projectId={id} />;
};

export default ProjectDetailPage;