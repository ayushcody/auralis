export default function DashboardOverview() {
  return (
    <div className="p-8 md:p-12">
      <h1
        className="text-2xl font-bold tracking-tight"
        style={{ color: "hsl(var(--au-text-primary))" }}
      >
        Overview
      </h1>
      <p
        className="mt-2 text-sm"
        style={{ color: "hsl(var(--au-text-secondary))" }}
      >
        Welcome to Auralis Studio. Select a section from the sidebar to get started.
      </p>
    </div>
  );
}
