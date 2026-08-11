export default function PortalProjectPage({
  params,
}: {
  params: { projectId: string }
}) {
  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-forge-black">
        Client Portal
      </h1>
      <p className="text-pebble">Project: {params.projectId}</p>
    </div>
  )
}
