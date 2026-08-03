"use client";

import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error("B-Bay page error", error); }, [error]);
  return <main className="grid min-h-dvh place-items-center bg-[#f7f7f6] p-6 text-center"><div className="max-w-sm rounded-3xl bg-white p-7 shadow-sm"><p className="text-sm font-bold uppercase tracking-[0.14em] text-orange-600">B-Bay</p><h1 className="mt-2 text-2xl font-extrabold text-zinc-950">Не удалось открыть страницу</h1><p className="mt-3 text-sm leading-6 text-zinc-500">Попробуйте обновить страницу. Если ошибка повторится, свяжитесь с кафе.</p><button type="button" onClick={reset} className="mt-5 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-600">Повторить</button></div></main>;
}
