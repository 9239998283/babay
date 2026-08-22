import type { Metadata } from "next";
import { CartPage } from "@/components/cart/cart-page";
import { getPublicRestaurantConfig } from "@/lib/supabase/restaurant";

export const metadata: Metadata = { title: "Корзина" };
export const revalidate = 0;

export default async function CartRoute() {
  const config = await getPublicRestaurantConfig();
  return <CartPage config={config} />;
}
