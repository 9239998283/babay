import { redirect } from "next/navigation";
import { AdminAccess } from "@/components/admin/admin-access";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Category, MenuItem } from "@/types/menu";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!isSupabaseConfigured()) return <AdminAccess configured={false} />;
  const supabase = await getSupabaseServerClient();
  if (!supabase) return <AdminAccess configured={false} />;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (user.app_metadata?.role !== "admin") return <AdminAccess configured email={user.email} />;
  const [categoriesResult, itemsResult] = await Promise.all([supabase.from("categories").select("*").order("sort_order").order("name"), supabase.from("menu_items").select("*").order("sort_order").order("name")]);
  return <AdminDashboard initialCategories={(categoriesResult.data ?? []) as Category[]} initialItems={(itemsResult.data ?? []) as MenuItem[]} email={user.email ?? "admin"} />;
}
