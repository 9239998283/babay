import { getSupabaseServerClient } from "./server";
import type { DeliveryZone, OpeningHours, PublicRestaurantConfig, RestaurantSettings } from "@/types/restaurant";

export const defaultOpeningHours: OpeningHours = Object.fromEntries(
  Array.from({ length: 7 }, (_, index) => [String(index + 1), { enabled: true, open: "10:00", close: "23:00" }]),
);

export const defaultRestaurantSettings: RestaurantSettings = {
  id: true,
  establishment_name: "B-Bay «Бабай»",
  address: "Грозный, центр города",
  phone: "+7 988 902-60-14",
  whatsapp_phone: (process.env.NEXT_PUBLIC_WHATSAPP_PHONE ?? "79889026014").replace(/\D/g, ""),
  orders_open: true,
  opening_hours: defaultOpeningHours,
  minimum_order: 0,
  preparation_minutes: 30,
  delivery_minutes: 60,
  payment_methods: ["cash", "transfer"],
};

export async function getPublicRestaurantConfig(): Promise<PublicRestaurantConfig> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return { settings: defaultRestaurantSettings, deliveryZones: [] };

  const [settingsResult, zonesResult] = await Promise.all([
    supabase.from("restaurant_settings").select("*").eq("id", true).maybeSingle(),
    supabase.from("delivery_zones").select("*").eq("is_active", true).order("sort_order").order("name"),
  ]);

  if (settingsResult.error || zonesResult.error || !settingsResult.data) {
    console.error("Unable to load public restaurant configuration");
    return { settings: defaultRestaurantSettings, deliveryZones: [] };
  }

  const settings = {
    ...settingsResult.data,
    opening_hours: settingsResult.data.opening_hours as unknown as OpeningHours,
  } as RestaurantSettings;

  return {
    settings,
    deliveryZones: (zonesResult.data ?? []) as DeliveryZone[],
  };
}

