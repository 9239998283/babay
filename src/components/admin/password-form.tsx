"use client";

import { KeyRound, LoaderCircle } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function PasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (password.length < 8) {
      setError("Пароль должен содержать не менее 8 символов.");
      return;
    }
    if (password !== confirmation) {
      setError("Пароли не совпадают.");
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("Supabase не настроен.");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError("Не удалось сохранить пароль: " + updateError.message);
      return;
    }

    setPassword("");
    setConfirmation("");
    setMessage("Пароль сохранён. Теперь можно входить с любого устройства без письма.");
  }

  return (
    <section className="mb-6 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-zinc-950/5 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-orange-50 text-orange-600">
          <KeyRound size={19} />
        </div>
        <div>
          <h2 className="font-bold text-zinc-950">Пароль администратора</h2>
          <p className="mt-1 text-sm leading-6 text-zinc-500">
            Задайте пароль после первого входа. Затем письма и одноразовые ссылки больше не понадобятся.
          </p>
        </div>
      </div>

      <form onSubmit={updatePassword} className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block text-sm font-semibold text-zinc-700">
          Новый пароль
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            minLength={8}
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
            minLength={8}
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
      </form>
    </section>
  );
}
