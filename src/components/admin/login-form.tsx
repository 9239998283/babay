"use client";

import { KeyRound, LoaderCircle, LockKeyhole, Mail } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type LoadingAction = "password" | "magic-link" | null;

export function LoginForm({ isConfigured, initialError = "" }: { isConfigured: boolean; initialError?: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(initialError);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState<LoadingAction>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);

  async function signInWithPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("Supabase не настроен. Добавьте переменные окружения.");
      return;
    }

    setLoading("password");
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(null);

    if (signInError) {
      setError(
        signInError.code === "invalid_credentials"
          ? "Неверный email или пароль. Если пароль ещё не задан, используйте одноразовую ссылку."
          : "Не удалось войти: " + signInError.message,
      );
      return;
    }

    window.location.assign("/admin");
  }

  async function sendMagicLink() {
    if (!emailInputRef.current?.reportValidity()) return;

    setError("");
    setMessage("");

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("Supabase не настроен. Добавьте переменные окружения.");
      return;
    }

    setLoading("magic-link");
    const { error: signInError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/admin`,
        shouldCreateUser: false,
      },
    });
    setLoading(null);

    if (signInError) {
      const isEmailLimit =
        signInError.code === "over_email_send_rate_limit" ||
        signInError.message.toLowerCase().includes("email rate limit");
      setError(
        isEmailLimit
          ? "Лимит писем временно исчерпан. Подождите до часа после предыдущего письма и не нажимайте кнопку повторно."
          : "Не удалось отправить ссылку: " + signInError.message,
      );
      return;
    }

    setMessage(
      "Ссылка отправлена. Откройте письмо на том же устройстве и в том же браузере, где запросили вход.",
    );
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-[#f7f7f6] p-5">
      <section className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-sm ring-1 ring-zinc-950/5">
        <div className="grid size-12 place-items-center rounded-2xl bg-orange-500 text-white">
          <LockKeyhole size={22} />
        </div>
        <p className="mt-5 text-xs font-bold uppercase tracking-[0.14em] text-orange-600">B-Bay</p>
        <h1 className="mt-1 text-2xl font-extrabold text-zinc-950">Вход для администратора</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-500">
          Войдите по email и паролю. Для первого входа можно запросить одноразовую ссылку.
        </p>

        <form onSubmit={signInWithPassword} className="mt-6 space-y-4">
          <label className="block text-sm font-semibold text-zinc-700">
            Email
            <input
              ref={emailInputRef}
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
              className="mt-1.5 h-11 w-full rounded-xl border border-zinc-200 px-3.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            />
          </label>
          <label className="block text-sm font-semibold text-zinc-700">
            Пароль
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
              className="mt-1.5 h-11 w-full rounded-xl border border-zinc-200 px-3.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            />
          </label>

          {error ? (
            <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm leading-6 text-red-700">
              {error}
            </p>
          ) : null}
          {message ? (
            <p role="status" className="rounded-xl bg-emerald-50 px-3 py-2 text-sm leading-6 text-emerald-800">
              {message}
            </p>
          ) : null}

          <Button type="submit" className="w-full" size="lg" disabled={loading !== null || !isConfigured}>
            {loading === "password" ? <LoaderCircle className="animate-spin" size={18} /> : <KeyRound size={18} />}
            Войти по паролю
          </Button>

          <div className="flex items-center gap-3 py-1 text-xs text-zinc-400">
            <span className="h-px flex-1 bg-zinc-200" />
            Первый вход
            <span className="h-px flex-1 bg-zinc-200" />
          </div>

          <Button
            type="button"
            variant="secondary"
            className="w-full"
            size="lg"
            disabled={loading !== null || !isConfigured}
            onClick={sendMagicLink}
          >
            {loading === "magic-link" ? <LoaderCircle className="animate-spin" size={18} /> : <Mail size={18} />}
            Получить одноразовую ссылку
          </Button>

          <p className="text-center text-xs leading-5 text-zinc-500">
            После первого входа задайте пароль в админ-панели — следующие письма не понадобятся.
          </p>

          {!isConfigured ? (
            <p className="text-center text-xs leading-5 text-zinc-500">
              Форма станет доступна после настройки переменных окружения.
            </p>
          ) : null}
        </form>
      </section>
    </main>
  );
}
