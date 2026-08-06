"use client";

import { ClipboardList, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/format";
import { clearSavedOrders, readSavedOrders, type SavedOrder } from "@/lib/order-history";
import { useLockBodyScroll } from "@/hooks/use-lock-body-scroll";

export function OrderHistoryDialog({ onClose }: { onClose: () => void }) {
  const [orders, setOrders] = useState<SavedOrder[]>(() => readSavedOrders());

  useLockBodyScroll(true);

  useEffect(() => {
    const refresh = () => setOrders(readSavedOrders());
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("b-bay-orders-updated", refresh);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("b-bay-orders-updated", refresh);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  function clearHistory() {
    clearSavedOrders();
    setOrders([]);
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end bg-zinc-950/55 backdrop-blur-sm sm:items-center sm:justify-center sm:p-6" role="dialog" aria-modal="true" aria-label="Мои заказы">
      <button type="button" aria-label="Закрыть историю заказов" className="absolute inset-0 cursor-default" onClick={onClose} />
      <section className="relative max-h-[90dvh] w-full max-w-xl overflow-y-auto rounded-t-[2rem] bg-[#f7f7f6] p-5 shadow-2xl dark:bg-zinc-950 sm:rounded-[2rem] sm:p-6">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-orange-600">На этом устройстве</p>
            <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-zinc-950 dark:text-white">Мои заказы</h2>
          </div>
          <button type="button" aria-label="Закрыть" onClick={onClose} className="grid size-10 place-items-center rounded-full bg-white text-zinc-700 shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-900 dark:text-zinc-200 dark:ring-white/10"><X size={20} /></button>
        </header>

        {orders.length ? (
          <>
            <div className="mt-5 space-y-3">
              {orders.map((order) => (
                <article key={order.id} className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-900 dark:ring-white/10">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-bold text-zinc-950 dark:text-white">{new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }).format(new Date(order.createdAt))}</p>
                      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{order.fulfillment === "delivery" ? "Доставка" : "Самовывоз"} · {order.payment === "cash" ? "наличными" : "переводом"}</p>
                    </div>
                    <p className="shrink-0 font-extrabold text-orange-600">{formatPrice(order.total)}</p>
                  </div>
                  <ul className="mt-3 space-y-1 border-t border-zinc-100 pt-3 text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-300">
                    {order.items.map((item, index) => <li key={`${order.id}-${index}`} className="flex justify-between gap-3"><span>{item.name}</span><span className="shrink-0 font-bold">× {item.quantity}</span></li>)}
                  </ul>
                  <p className="mt-3 rounded-xl bg-orange-50 px-3 py-2 text-xs font-medium text-orange-800 dark:bg-orange-950/30 dark:text-orange-300">Заказ был подготовлен для отправки в WhatsApp.</p>
                </article>
              ))}
            </div>
            <button type="button" onClick={clearHistory} className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-red-600 dark:text-red-400"><Trash2 size={16} />Очистить историю</button>
          </>
        ) : (
          <div className="mt-8 rounded-3xl border border-dashed border-zinc-300 bg-white px-6 py-10 text-center dark:border-zinc-700 dark:bg-zinc-900">
            <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-orange-50 text-orange-600 dark:bg-orange-950/40"><ClipboardList size={22} /></span>
            <p className="mt-4 font-bold text-zinc-950 dark:text-white">Заказов пока нет</p>
            <p className="mt-2 text-sm leading-5 text-zinc-500 dark:text-zinc-400">После оформления в WhatsApp здесь сохранится состав и сумма заказа.</p>
          </div>
        )}
      </section>
    </div>
  );
}
