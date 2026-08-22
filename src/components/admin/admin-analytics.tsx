"use client";

import { useEffect, useMemo, useState } from "react";
import { formatPrice } from "@/lib/format";
import { orderStatusLabels, type AdminOrder, type OrderStatus } from "@/types/orders";

export function AdminAnalytics() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    void fetch("/api/admin/orders", { cache: "no-store" }).then(async (response) => {
      const payload = await response.json() as { orders?: AdminOrder[]; error?: string };
      if (!response.ok || !payload.orders) return setError(payload.error ?? "Не удалось загрузить аналитику.");
      setOrders(payload.orders);
    }).catch(() => setError("Нет связи с сервером аналитики."));
  }, []);

  const analytics = useMemo(() => {
    const completed = orders.filter((order) => order.status !== "cancelled");
    const revenue = completed.reduce((sum, order) => sum + order.total, 0);
    const dishCounts = new Map<string, number>();
    for (const order of completed) for (const item of order.order_items) dishCounts.set(item.item_name, (dishCounts.get(item.item_name) ?? 0) + item.quantity);
    return {
      revenue,
      average: completed.length ? Math.round(revenue / completed.length) : 0,
      cancelled: orders.filter((order) => order.status === "cancelled").length,
      popular: [...dishCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5),
      statuses: Object.entries(orderStatusLabels).map(([status, label]) => ({ status: status as OrderStatus, label, count: orders.filter((order) => order.status === status).length })),
    };
  }, [orders]);

  return <section><h2 className="text-2xl font-extrabold tracking-tight text-zinc-950">Аналитика</h2><p className="mt-1 text-sm text-zinc-500">Оперативная сводка по последним 200 заказам.</p>{error ? <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}<div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Заказов" value={String(orders.length)} /><Metric label="Выручка" value={formatPrice(analytics.revenue)} /><Metric label="Средний чек" value={formatPrice(analytics.average)} /><Metric label="Отмены" value={String(analytics.cancelled)} /></div><div className="mt-6 grid gap-6 lg:grid-cols-2"><section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-zinc-950/5"><h3 className="font-bold">Популярные блюда</h3><ol className="mt-4 space-y-3">{analytics.popular.map(([name, count], index) => <li key={name} className="flex justify-between gap-4 text-sm"><span>{index + 1}. {name}</span><strong>{count} шт.</strong></li>)}</ol></section><section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-zinc-950/5"><h3 className="font-bold">Заказы по статусам</h3><div className="mt-4 space-y-3">{analytics.statuses.map((item) => <div key={item.status} className="flex justify-between gap-4 text-sm"><span>{item.label}</span><strong>{item.count}</strong></div>)}</div></section></div></section>;
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-zinc-950/5"><p className="text-sm text-zinc-500">{label}</p><p className="mt-2 text-2xl font-extrabold text-zinc-950">{value}</p></div>; }

