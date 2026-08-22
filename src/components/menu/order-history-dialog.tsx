"use client";

import Link from "next/link";
import { ClipboardList, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { formatPrice } from "@/lib/format";
import { clearSavedOrders, readSavedOrders, updateSavedOrderStatus, type SavedOrderReference } from "@/lib/order-history";
import { useLockBodyScroll } from "@/hooks/use-lock-body-scroll";
import { useModalDialog } from "@/hooks/use-modal-dialog";
import { orderStatusLabels, type PublicOrderStatus } from "@/types/orders";

export function OrderHistoryDialog({ onClose }: { onClose: () => void }) {
  const [orders, setOrders] = useState<SavedOrderReference[]>([]);
  useLockBodyScroll(true);
  const dialogRef = useModalDialog<HTMLElement>(true, onClose);

  const refreshStatuses = useCallback(async () => {
    const current = readSavedOrders();
    if (!current.length) return setOrders([]);
    const statuses = await Promise.all(current.map(async (reference) => {
      try {
        const response = await fetch(`/api/orders/${encodeURIComponent(reference.orderNumber)}/status`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ trackingToken: reference.trackingToken }),
        });
        if (!response.ok) return reference;
        const payload = await response.json() as { order?: PublicOrderStatus };
        if (!payload.order) return reference;
        updateSavedOrderStatus(reference.orderNumber, payload.order.status);
        return { ...reference, status: payload.order.status };
      } catch {
        return reference;
      }
    }));
    setOrders(statuses);
  }, []);

  useEffect(() => {
    const initialRefresh = window.setTimeout(() => void refreshStatuses(), 0);
    const interval = window.setInterval(() => void refreshStatuses(), 20_000);
    const refresh = () => void refreshStatuses();
    window.addEventListener("b-bay-orders-updated", refresh);
    return () => {
      window.clearTimeout(initialRefresh);
      window.clearInterval(interval);
      window.removeEventListener("b-bay-orders-updated", refresh);
    };
  }, [refreshStatuses]);

  function clearHistory() {
    clearSavedOrders();
    setOrders([]);
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end bg-zinc-950/55 backdrop-blur-sm sm:items-center sm:justify-center sm:p-6" role="dialog" aria-modal="true" aria-label="Мои заказы">
      <button type="button" aria-label="Закрыть историю заказов" className="absolute inset-0 cursor-default" onClick={onClose} />
      <section ref={dialogRef} tabIndex={-1} className="relative max-h-[90dvh] w-full max-w-xl overflow-y-auto rounded-t-[2rem] bg-[#f7f7f6] p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl dark:bg-zinc-950 sm:rounded-[2rem] sm:p-6">
        <header className="flex items-start justify-between gap-4">
          <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-orange-600">Сохранены на сервере</p><h2 className="mt-1 text-2xl font-extrabold tracking-tight text-zinc-950 dark:text-white">Мои заказы</h2></div>
          <button type="button" aria-label="Закрыть" onClick={onClose} className="grid size-11 place-items-center rounded-full bg-white text-zinc-700 shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-900 dark:text-zinc-200"><X size={20} /></button>
        </header>

        {orders.length ? <>
          <div className="mt-5 space-y-3">
            {orders.map((order) => <Link key={order.orderNumber} href={`/order/${order.orderNumber}#token=${encodeURIComponent(order.trackingToken)}`} onClick={onClose} className="block rounded-3xl bg-white p-4 shadow-sm ring-1 ring-zinc-950/5 transition hover:ring-orange-300 dark:bg-zinc-900 dark:ring-white/10">
              <div className="flex items-start justify-between gap-4"><div><p className="font-extrabold text-zinc-950 dark:text-white">{order.orderNumber}</p><p className="mt-1 text-xs text-zinc-500">{new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }).format(new Date(order.createdAt))}</p></div><p className="shrink-0 font-extrabold text-orange-600">{formatPrice(order.total)}</p></div>
              <p className="mt-3 inline-flex rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">{orderStatusLabels[order.status]}</p>
            </Link>)}
          </div>
          <button type="button" onClick={clearHistory} className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-red-600 dark:text-red-400"><Trash2 size={16} />Очистить список на устройстве</button>
        </> : <div className="mt-8 rounded-3xl border border-dashed border-zinc-300 bg-white px-6 py-10 text-center dark:border-zinc-700 dark:bg-zinc-900"><span className="mx-auto grid size-12 place-items-center rounded-2xl bg-orange-50 text-orange-600 dark:bg-orange-950/40"><ClipboardList size={22} /></span><p className="mt-4 font-bold text-zinc-950 dark:text-white">Заказов пока нет</p><p className="mt-2 text-sm leading-5 text-zinc-500 dark:text-zinc-400">После оформления здесь появится номер и актуальный статус серверного заказа.</p></div>}
      </section>
    </div>
  );
}
