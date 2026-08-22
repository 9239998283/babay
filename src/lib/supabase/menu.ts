import { demoCategories, demoMenuItems } from "@/data/demo-menu";
import type { Category, MenuItem, MenuPayload } from "@/types/menu";
import { getSupabaseServerClient } from "./server";

export async function getPublicMenu(): Promise<MenuPayload> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return { categories: demoCategories, items: demoMenuItems, source: "demo" };
  }

  const [categoriesResult, itemsResult, modifiersResult] = await Promise.all([
    supabase.from("categories").select("*").eq("is_active", true).order("sort_order").order("name"),
    supabase.from("menu_items").select("*").order("sort_order").order("name"),
    supabase.from("menu_item_modifiers").select("*").eq("is_active", true).order("sort_order").order("name"),
  ]);

  if (categoriesResult.error || itemsResult.error || modifiersResult.error) {
    console.error("Unable to load B-Bay menu");
    return { categories: demoCategories, items: demoMenuItems, source: "demo" };
  }

  const categories = (categoriesResult.data ?? []) as Category[];
  const activeCategoryIds = new Set(categories.map((category) => category.id));
  const modifiers = modifiersResult.data ?? [];

  return {
    categories,
    items: ((itemsResult.data ?? []) as MenuItem[]).filter(
      (item) => item.category_id === null || activeCategoryIds.has(item.category_id),
    ).map((item) => ({
      ...item,
      options: modifiers
        .filter((modifier) => modifier.menu_item_id === item.id)
        .map((modifier) => ({ id: modifier.id, name: modifier.name, price: modifier.price_delta })),
    })),
    source: "supabase",
  };
}
