import { MenuHome } from "@/components/menu/menu-home";
import { getPublicMenu } from "@/lib/supabase/menu";
import { getPublicRestaurantConfig } from "@/lib/supabase/restaurant";

export const revalidate = 0;

export default async function Home() {
  const [menu, config] = await Promise.all([getPublicMenu(), getPublicRestaurantConfig()]);
  return <MenuHome categories={menu.categories} items={menu.items} isDemo={menu.source === "demo"} config={config} />;
}
