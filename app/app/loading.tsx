/**
 * Instant skeleton for the whole workspace. There was previously no loading boundary anywhere
 * under /app except image-studio, so the browser kept showing the login page until the server
 * finished streaming the real dashboard. This renders the same geometry as DashboardShell so the
 * layout does not jump when the real content arrives.
 */
export default function WorkspaceLoading() {
  return (
    <div className="min-h-screen bg-canvas" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading your workspace…</span>
      <div className="flex">
        <aside className="hidden w-[248px] shrink-0 border-r border-line bg-white lg:block">
          <div className="flex h-[72px] items-center border-b border-line px-5">
            <div className="h-6 w-28 animate-pulse rounded-md bg-subtle" />
          </div>
          <div className="space-y-5 px-3 py-5">
            {[0, 1, 2].map((group) => (
              <div key={group} className="space-y-2">
                <div className="mx-3 h-2.5 w-16 animate-pulse rounded bg-subtle" />
                {[0, 1, 2, 3].map((item) => (
                  <div key={item} className="h-11 animate-pulse rounded-xl bg-soft" />
                ))}
              </div>
            ))}
          </div>
        </aside>
        <main className="min-w-0 flex-1">
          <div className="flex h-[72px] items-center justify-between border-b border-line bg-white px-5">
            <div className="h-4 w-32 animate-pulse rounded bg-subtle" />
            <div className="size-9 animate-pulse rounded-full bg-subtle" />
          </div>
          <div className="mx-auto w-full max-w-[1200px] px-5 py-8">
            <div className="h-52 animate-pulse rounded-[28px] border border-teal/10 bg-[#eaf5ef]" />
            <div className="mt-9 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[0, 1, 2, 3].map((card) => (
                <div key={card} className="h-52 animate-pulse rounded-3xl border border-line bg-white" />
              ))}
            </div>
            <div className="mt-10 grid gap-6 xl:grid-cols-2">
              <div className="h-64 animate-pulse rounded-3xl border border-line bg-white" />
              <div className="h-64 animate-pulse rounded-3xl border border-line bg-white" />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
