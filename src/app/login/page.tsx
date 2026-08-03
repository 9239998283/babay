import type { Metadata } from "next";
import { LoginForm } from "@/components/admin/login-form";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Вход администратора", robots: { index: false, follow: false } };

export default function LoginPage() { return <LoginForm isConfigured={isSupabaseConfigured()} />; }
