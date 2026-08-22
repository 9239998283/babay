import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PrintOrderButton } from "@/components/admin/print-order-button";
import { getAdminContext } from "@/lib/server/auth";
import { formatPrice } from "@/lib/format";
import { orderStatusLabels, type AdminOrder, type OrderStatus } from "@/types/orders";

export const dynamic = "force-dynamic";

export default async function PrintOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminContext();
  if (!admin.ok) {
    if (admin.status === 401) redirect("/login");
    redirect("/admin");
  }
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const [{ data, error }, { data: settings }] = await Promise.all([
    admin.supabase.from("orders").select(`
      id, order_number, created_at, updated_at, status_updated_at,
      customer_name, customer_phone, fulfillment_method, delivery_address,
      delivery_zone_id, delivery_zone_name, payment_method, promo_code,
      subtotal, discount_amount, delivery_fee, total, order_comment,
      status, cancelled_reason,
      order_items (id, item_name, unit_price, quantity, modifiers, modifiers_total, item_comment, line_total)
    `).eq("id", id).single(),
    admin.supabase.from("restaurant_settings").select("establishment_name,address,phone").eq("id", true).single(),
  ]);
  if (error || !data) notFound();
  const order = data as unknown as AdminOrder;
  const paymentLabel = order.payment_method === "cash" ? "Наличными" : "Переводом";

  return (
    <main className="mx-auto min-h-dvh max-w-3xl bg-white px-5 py-6 text-zinc-950 print:max-w-none print:p-0">
      <div className="print:hidden mb-6 flex items-center justify-between gap-3">
        <Link href="/admin" className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-bold text-zinc-600 hover:bg-zinc-100">← В админку</Link>
        <PrintOrderButton />
      </div>
      <header className="border-b-2 border-zinc-950 pb-4">
        <div className="flex items-start justify-between gap-5">
          <div>
            <p className="text-sm font-bold">{settings?.establishment_name ?? "B-Bay · Бабай"}</p>
            <h1 className="mt-1 text-3xl font-black">Заказ № {order.order_number}</h1>
          </div>
          <div className="text-right text-sm">
            <p>{new Intl.DateTimeFormat("ru-RU", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Moscow" }).format(new Date(order.created_at))}</p>
            <p className="mt-1 font-bold">{orderStatusLabels[order.status as OrderStatus]}</p>
          </div>
        </div>
      </header>

      <section className="grid gap-2 border-b border-zinc-300 py-4 text-sm sm:grid-cols-2">
        <p><b>Клиент:</b> {order.customer_name}</p><p><b>Телефон:</b> {order.customer_phone}</p>
        <p><b>Получение:</b> {order.fulfillment_method === "delivery" ? "Доставка" : "Самовывоз"}</p><p><b>Оплата:</b> {paymentLabel}</p>
        {order.delivery_address ? <p className="sm:col-span-2"><b>Адрес:</b> {order.delivery_address}{order.delivery_zone_name ? ` · ${order.delivery_zone_name}` : ""}</p> : null}
        {order.order_comment ? <p className="sm:col-span-2"><b>Комментарий:</b> {order.order_comment}</p> : null}
      </section>

      <section className="py-4">
        <h2 className="text-lg font-black">Состав заказа</h2>
        <div className="mt-3 divide-y divide-zinc-200 border-y border-zinc-300">
          {order.order_items.map((item) => (
            <div key={item.id} className="grid grid-cols-[1fr_auto] gap-4 py-3 text-sm">
              <div><p className="font-bold">{item.quantity} × {item.item_name}</p>{item.modifiers.length ? <p className="mt-1 text-zinc-600">{item.modifiers.map((modifier) => `${modifier.name}${modifier.price ? ` +${formatPrice(modifier.price)}` : ""}`).join(", ")}</p> : null}{item.item_comment ? <p className="mt-1 italic">Комментарий: {item.item_comment}</p> : null}</div>
              <p className="font-bold">{formatPrice(item.line_total)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="ml-auto max-w-sm space-y-2 border-t-2 border-zinc-950 pt-4 text-sm">
        <PriceRow label="Блюда" value={order.subtotal} />
        <PriceRow label="Доставка" value={order.delivery_fee} />
        {order.discount_amount ? <PriceRow label={`Скидка${order.promo_code ? ` (${order.promo_code})` : ""}`} value={-order.discount_amount} /> : null}
        <div className="flex justify-between gap-4 pt-2 text-xl font-black"><span>Итого</span><span>{formatPrice(order.total)}</span></div>
      </section>
      <footer className="mt-10 border-t border-dashed border-zinc-400 pt-3 text-xs text-zinc-500">{settings?.address} · {settings?.phone}</footer>
    </main>
  );
}

function PriceRow({ label, value }: { label: string; value: number }) {
  return <div className="flex justify-between gap-4"><span>{label}</span><span>{value < 0 ? `− ${formatPrice(Math.abs(value))}` : formatPrice(value)}</span></div>;
}
