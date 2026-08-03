import type { Metadata } from "next";
import { LoginForm } from "@/components/admin/login-form";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Вход администратора", robots: { index: false, follow: false } };

const callbackErrors: Record<string, string> = {
  auth_callback: "Ссылка была открыта в другом браузере или уже использована. Запросите новую ссылку и откройте её в том же браузере.",
  missing_code: "Ссылка для входа неполная или устарела. Запросите новую ссылку.",
  not_configured: "Вход временно не настроен. Обратитесь к администратору.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return <LoginForm isConfigured={isSupabaseConfigured()} initialError={error ? callbackErrors[error] : undefined} />;
}
