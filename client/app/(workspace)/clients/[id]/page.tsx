import ClientDetail from "@/components/client/client-detail";

/**
 * Next 16 makes `params` a promise, so it is awaited here rather than read
 * synchronously. The page stays a thin shell and the fetching happens in the
 * client component, matching `/projects/[id]`.
 */
const ClientDetailPage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;

  return <ClientDetail clientId={id} />;
};

export default ClientDetailPage;
