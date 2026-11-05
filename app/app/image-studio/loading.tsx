export default function WorkspaceLoading() {
  return (
    <div aria-busy="true" aria-label="Loading Image Studio" className="animate-pulse">
      <span className="sr-only" role="status">Loading Image Studio…</span>
      <div className="mb-8 space-y-3"><div className="h-3 w-28 rounded bg-line" /><div className="h-10 w-full max-w-lg rounded-xl bg-line" /><div className="h-4 w-full max-w-xl rounded bg-line/70" /></div>
      <div className="h-64 rounded-3xl bg-[#e7efeb]" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[0, 1, 2, 3].map((item) => <div key={item} className="h-44 rounded-3xl border border-line bg-white" />)}</div>
    </div>
  );
}
