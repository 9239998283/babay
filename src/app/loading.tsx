export default function Loading() {
  return <main className="min-h-dvh bg-[#f7f7f6] px-4 py-5 dark:bg-zinc-950 sm:px-6"><div className="mx-auto max-w-6xl"><div className="h-44 animate-pulse rounded-[2rem] bg-zinc-200 dark:bg-zinc-800" /><div className="mt-5 h-13 animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-800" /><div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{Array.from({ length: 8 }, (_, index) => <div key={index} className="aspect-[.78] animate-pulse rounded-3xl bg-zinc-200 dark:bg-zinc-800" />)}</div></div></main>;
}
