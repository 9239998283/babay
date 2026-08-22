"use client";

import Link from "next/link";
import { ArrowLeft, Clock3, LoaderCircle, ReceiptText } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { formatPrice } from "@/lib/format";
import { readSavedOrders, updateSavedOrderStatus } from "@/lib/order-history";
import { orderStatusLabels, orderStatuses, type PublicOrderStatus } from "@/types/orders";

export function OrderStatusView({ orderNumber }: { orderNumber: string }) {
  const [order, setOrder] = useState<PublicOrderStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (trackingToken: string) => {
    if (!trackingToken) {
      setLoading(false);
      setError("Защитный ключ заказа не найден. Откройте статус из раздела «Мои заказы» на устройстве, где оформляли заказ.");
      return;
    }
    try {
      const response = await fetch(`/api/orders/${encodeURIComponent(orderNumber)}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackingToken }),
      });
      const payload = await response.json() as { order?: PublicOrderStatus; error?: string };
      if (!response.ok || !payload.order) {
        setError(payload.error ?? "Заказ не найден.");
        return;
      }
      setOrder(payload.order);
      setError("");
      updateSavedOrderStatus(payload.order.orderNumber, payload.order.status);
    } catch {
      setError("Нет связи с сервером статусов.");
    } finally {
      setLoading(false);
    }
  }, [orderNumber]);

  useEffect(() => {
    let interval: number | undefined;
    const initialLoad = window.setTimeout(() => {
      const hashToken = new URLSearchParams(window.location.hash.slice(1)).get("token") ?? "";
      const localToken = readSavedOrders().find((item) => item.orderNumber === orderNumber)?.trackingToken ?? "";
      const trackingToken = hashToken || localToken;
      void load(trackingToken);
      if (trackingToken) interval = window.setInterval(() => void load(trackingToken), 15_000);
    }, 0);
    return () => {
      window.clearTimeout(initialLoad);
      if (interval) window.clearInterval(interval);
    };
  }, [load, orderNumber]);

  return (
    <main className="min-h-dvh bg-[#f7f7f6] px-4 py-6 dark:bg-zinc-950 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-xl">
        <Link href="/" className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-zinc-600 hover:text-orange-600 dark:text-zinc-300"><ArrowLeft size={18} />К меню</Link>
        <section className="mt-4 rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-900 dark:ring-white/10 sm:p-7">
          <div className="grid size-12 place-items-center rounded-2xl bg-orange-50 text-orange-600 dark:bg-orange-950/40"><ReceiptText size={22} /></div>
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.14em] text-orange-600">Статус заказа</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-white">{orderNumber}</h1>

          {loading ? <p className="mt-6 flex items-center gap-2 text-sm text-zinc-500"><LoaderCircle className="animate-spin" size={18} />Обновляем статус…</p> : null}
          {error ? <p role="alert" className="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-sm leading-6 text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p> : null}
          {order ? <OrderStatusDetails order={order} /> : null}
        </section>
      </div>
    </main>
  );
}

function OrderStatusDetails({ order }: { order: PublicOrderStatus }) {
  const currentIndex = orderStatuses.indexOf(order.status);
  const terminal = order.status === "cancelled";
  return (
    <div className="mt-6">
      <div className={`rounded-2xl px-4 py-4 ${terminal ? "bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300" : "bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"}`}>
        <p className="text-xs font-bold uppercase tracking-[0.12em]">Сейчас</p>
        <p className="mt-1 text-xl font-extrabold">{orderStatusLabels[order.status]}</p>
        <p className="mt-2 flex items-center gap-2 text-xs opacity-75"><Clock3 size={14} />Обновлено {new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" }).format(new Date(order.updatedAt))}</p>
      </div>

      {!terminal ? <ol className="mt-5 grid grid-cols-6 gap-1" aria-label="Этапы заказа">
        {orderStatuses.filter((status) => status !== "cancelled").map((status, index) => <li key={status} className="min-w-0"><span className={`block h-2 rounded-full ${index <= currentIndex ? "bg-orange-500" : "bg-zinc-200 dark:bg-zinc-700"}`} /><span className="sr-only">{orderStatusLabels[status]}</span></li>)}
      </ol> : null}

      <div className="mt-6 space-y-2 border-t border-zinc-100 pt-5 text-sm dark:border-zinc-800">
        {order.items.map((item, index) => <div key={`${item.name}-${index}`} className="flex justify-between gap-4 text-zinc-600 dark:text-zinc-300"><span>{item.name} × {item.quantity}</span><span className="font-bold">{formatPrice(item.lineTotal)}</span></div>)}
        <div className="flex justify-between gap-4 pt-2 font-extrabold text-zinc-950 dark:text-white"><span>Итого</span><span>{formatPrice(order.total)}</span></div>
      </div>
    </div>
  );
}
