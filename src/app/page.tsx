import { MenuHome } from "@/components/menu/menu-home";
import { getPublicMenu } from "@/lib/supabase/menu";

export const revalidate = 60;

export default async function Home() {
  const menu = await getPublicMenu();
  return <MenuHome categories={menu.categories} items={menu.items} isDemo={menu.source === "demo"} />;
}
