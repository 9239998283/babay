import type { Metadata } from "next";
import { OrderStatusView } from "@/components/orders/order-status-view";

export const metadata: Metadata = { title: "Статус заказа", robots: { index: false, follow: false } };

export default async function OrderStatusPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params;
  return <OrderStatusView orderNumber={orderNumber} />;
}

