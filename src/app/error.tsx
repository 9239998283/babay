"use client";

import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error("B-Bay page error", error); }, [error]);
  return <main className="grid min-h-dvh place-items-center bg-[#f7f7f6] p-6 text-center dark:bg-zinc-950"><div className="max-w-sm rounded-3xl bg-white p-7 shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-900 dark:ring-white/10"><p className="text-sm font-bold uppercase tracking-[0.14em] text-orange-600">B-Bay</p><h1 className="mt-2 text-2xl font-extrabold text-zinc-950 dark:text-white">Не удалось открыть страницу</h1><p className="mt-3 text-sm leading-6 text-zinc-500 dark:text-zinc-400">Попробуйте обновить страницу. Если ошибка повторится, свяжитесь с кафе.</p><button type="button" onClick={reset} className="mt-5 min-h-11 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-600">Повторить</button></div></main>;
}
