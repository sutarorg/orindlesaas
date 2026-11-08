export default function AdminLoading() {
  return (
    <div aria-busy="true" className="animate-pulse">
      <span className="sr-only" role="status">Loading admin console…</span>
      <div className="space-y-3">
        <div className="h-3 w-24 rounded bg-line" />
        <div className="h-9 w-full max-w-md rounded-xl bg-line" />
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((card) => <div key={card} className="h-28 rounded-2xl border border-line bg-white" />)}
      </div>
      <div className="mt-8 space-y-3">
        {[0, 1, 2, 3, 4, 5].map((row) => <div key={row} className="h-14 rounded-xl border border-line bg-white" />)}
      </div>
    </div>
  );
}
