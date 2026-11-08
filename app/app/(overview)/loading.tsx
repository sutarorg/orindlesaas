export default function OverviewLoading() {
  return (
    <div aria-busy="true" className="animate-pulse">
      <span className="sr-only" role="status">Loading your workspace…</span>
      <div className="h-52 rounded-[28px] border border-teal/10 bg-[#eaf5ef]" />
      <div className="mt-9 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((card) => <div key={card} className="h-52 rounded-3xl border border-line bg-white" />)}
      </div>
      <div className="mt-10 grid gap-6 xl:grid-cols-2">
        <div className="h-64 rounded-3xl border border-line bg-white" />
        <div className="h-64 rounded-3xl border border-line bg-white" />
      </div>
    </div>
  );
}
