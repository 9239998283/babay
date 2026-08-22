import { redirect } from "next/navigation";
import { AdminAccess } from "@/components/admin/admin-access";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { defaultRestaurantSettings } from "@/lib/supabase/restaurant";
import type { Category, MenuItem } from "@/types/menu";
import type { DeliveryZone, OpeningHours, PromoCode, RestaurantSettings } from "@/types/restaurant";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!isSupabaseConfigured()) return <AdminAccess configured={false} />;
  const supabase = await getSupabaseServerClient();
  if (!supabase) return <AdminAccess configured={false} />;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (user.app_metadata?.role !== "admin") return <AdminAccess configured email={user.email} />;
  const [categoriesResult, itemsResult, settingsResult, zonesResult, promosResult] = await Promise.all([
    supabase.from("categories").select("*").order("sort_order").order("name"),
    supabase.from("menu_items").select("*").order("sort_order").order("name"),
    supabase.from("restaurant_settings").select("*").eq("id", true).single(),
    supabase.from("delivery_zones").select("*").order("sort_order").order("name"),
    supabase.from("promo_codes").select("*").order("code"),
  ]);
  const settings = settingsResult.data ? {
    ...settingsResult.data,
    opening_hours: settingsResult.data.opening_hours as unknown as OpeningHours,
  } as RestaurantSettings : defaultRestaurantSettings;
  return <AdminDashboard
    initialCategories={(categoriesResult.data ?? []) as Category[]}
    initialItems={(itemsResult.data ?? []) as MenuItem[]}
    initialSettings={settings}
    initialZones={(zonesResult.data ?? []) as DeliveryZone[]}
    initialPromos={(promosResult.data ?? []) as PromoCode[]}
    email={user.email ?? "admin"}
  />;
}
