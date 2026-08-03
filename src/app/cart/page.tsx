import type { Metadata } from "next";
import { CartPage } from "@/components/cart/cart-page";

export const metadata: Metadata = { title: "Корзина" };

export default function CartRoute() {
  return <CartPage />;
}
