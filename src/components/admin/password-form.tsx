"use client";

import { KeyRound, LoaderCircle, ShieldCheck } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";

export function PasswordForm({ embedded = false }: { embedded?: boolean }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (password.length < 10) {
      setError("Пароль должен содержать не менее 10 символов.");
      return;
    }
    if (password !== confirmation) {
      setError("Пароли не совпадают.");
      return;
    }

    setLoading(true);
    let response: Response;
    try {
      response = await fetch("/api/admin/security/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword: password }),
      });
    } catch {
      setLoading(false);
      setError("Нет связи с сервером.");
      return;
    }
    const payload = await response.json() as { error?: string };
    setLoading(false);

    if (!response.ok) {
      setError(payload.error ?? "Не удалось сохранить пароль.");
      return;
    }

    setCurrentPassword("");
    setPassword("");
    setConfirmation("");
    setMessage("Пароль изменён. Все другие сессии завершены.");
  }

  async function revokeOtherSessions() {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/security/sessions", { method: "DELETE" });
      const payload = await response.json() as { error?: string };
      if (!response.ok) setError(payload.error ?? "Не удалось завершить сессии.");
      else setMessage("Все другие сессии администратора завершены.");
    } catch { setError("Нет связи с сервером."); }
    finally { setLoading(false); }
  }

  return (
    <section className={embedded ? "pt-4" : "mb-6 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-zinc-950/5 sm:p-5"}>
      <div className="flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-orange-50 text-orange-600">
          <KeyRound size={19} />
        </div>
        <div>
          <h2 className="font-bold text-zinc-950">Пароль администратора</h2>
          <p className="mt-1 text-sm leading-6 text-zinc-500">
            Для смены нужен текущий пароль. После изменения остальные сессии будут завершены.
          </p>
        </div>
      </div>

      <form onSubmit={updatePassword} className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block text-sm font-semibold text-zinc-700 sm:col-span-2">
          Текущий пароль
          <input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} autoComplete="current-password" required className="mt-1.5 h-10 w-full rounded-xl border border-zinc-200 px-3 text-sm font-normal outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
        </label>
        <label className="block text-sm font-semibold text-zinc-700">
          Новый пароль
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            minLength={10}
            required
            className="mt-1.5 h-10 w-full rounded-xl border border-zinc-200 px-3 text-sm font-normal outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
          />
        </label>
        <label className="block text-sm font-semibold text-zinc-700">
          Повторите пароль
          <input
            type="password"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            autoComplete="new-password"
            minLength={10}
            required
            className="mt-1.5 h-10 w-full rounded-xl border border-zinc-200 px-3 text-sm font-normal outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
          />
        </label>

        {error ? (
          <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2">
            {error}
          </p>
        ) : null}
        {message ? (
          <p role="status" className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800 sm:col-span-2">
            {message}
          </p>
        ) : null}

        <Button type="submit" disabled={loading} className="sm:col-span-2 sm:w-fit">
          {loading ? <LoaderCircle className="animate-spin" size={17} /> : <KeyRound size={17} />}
          Сохранить пароль
        </Button>
        <button type="button" disabled={loading} onClick={() => void revokeOtherSessions()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-zinc-200 px-4 text-sm font-bold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50 sm:col-span-2 sm:w-fit">
          <ShieldCheck size={17} /> Завершить другие сессии
        </button>
      </form>
    </section>
  );
}
