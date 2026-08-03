"use client";

import { LoaderCircle, LockKeyhole } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function LoginForm({ isConfigured }: { isConfigured: boolean }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return setError("Supabase не настроен. Добавьте .env.local по примеру .env.example.");
    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (signInError) return setError("Не удалось войти: " + signInError.message);
    window.location.assign("/admin");
  }
  return <main className="grid min-h-dvh place-items-center bg-[#f7f7f6] p-5"><section className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-sm ring-1 ring-zinc-950/5"><div className="grid size-12 place-items-center rounded-2xl bg-orange-500 text-white"><LockKeyhole size={22} /></div><p className="mt-5 text-xs font-bold uppercase tracking-[0.14em] text-orange-600">B-Bay</p><h1 className="mt-1 text-2xl font-extrabold text-zinc-950">Вход для администратора</h1><p className="mt-2 text-sm leading-6 text-zinc-500">Используйте учётную запись, которой назначена роль администратора в Supabase.</p><form onSubmit={signIn} className="mt-6 space-y-4"><label className="block text-sm font-semibold text-zinc-700">Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required className="mt-1.5 h-11 w-full rounded-xl border border-zinc-200 px-3.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" /></label><label className="block text-sm font-semibold text-zinc-700">Пароль<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required className="mt-1.5 h-11 w-full rounded-xl border border-zinc-200 px-3.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" /></label>{error ? <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}<Button type="submit" className="w-full" size="lg" disabled={loading || !isConfigured}>{loading ? <LoaderCircle className="animate-spin" size={18} /> : null}Войти</Button>{!isConfigured ? <p className="text-center text-xs leading-5 text-zinc-500">Форма станет доступна после настройки переменных окружения.</p> : null}</form></section></main>;
}
