import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Оформление заказа" };

export default function CheckoutPage() {
  redirect("/cart");
}
