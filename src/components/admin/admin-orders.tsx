"use client";

import Link from "next/link";
import { BellRing, LoaderCircle, Printer, RefreshCw, Search, Volume2, VolumeX } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatPrice } from "@/lib/format";
import { canTransitionOrderStatus, orderStatusLabels, orderStatuses, type AdminOrder, type OrderStatus } from "@/types/orders";

export function AdminOrders() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [updatingId, setUpdatingId] = useState("");
  const knownIds = useRef<Set<string> | null>(null);
  const audioContext = useRef<AudioContext | null>(null);

  const playNotification = useCallback(() => {
    if (!soundEnabled) return;
    const context = audioContext.current;
    if (!context) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.setValueAtTime(880, context.currentTime);
    gain.gain.setValueAtTime(0.08, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.35);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.35);
  }, [soundEnabled]);

  const loadOrders = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (status) params.set("status", status);
    if (date) { params.set("dateFrom", date); params.set("dateTo", date); }
    try {
      const response = await fetch(`/api/admin/orders?${params}`, { cache: "no-store" });
      const payload = await response.json() as { orders?: AdminOrder[]; error?: string };
      if (!response.ok || !payload.orders) {
        setError(payload.error ?? "Не удалось загрузить заказы.");
        return;
      }
      const nextIds = new Set(payload.orders.map((order) => order.id));
      if (knownIds.current) {
        const newOrders = payload.orders.filter((order) => order.status === "new" && !knownIds.current?.has(order.id));
        if (newOrders.length) {
          setNotice(`Новых заказов: ${newOrders.length}`);
          playNotification();
        }
      }
      knownIds.current = nextIds;
      setOrders(payload.orders);
      setError("");
    } catch {
      setError("Нет связи с сервером заказов.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [date, playNotification, search, status]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadOrders(), 250);
    const interval = window.setInterval(() => void loadOrders(true), 10_000);
    return () => { window.clearTimeout(timeout); window.clearInterval(interval); };
  }, [loadOrders]);

  async function toggleSound() {
    if (!soundEnabled) {
      audioContext.current ??= new AudioContext();
      await audioContext.current.resume();
    }
    setSoundEnabled((value) => !value);
  }

  async function changeStatus(order: AdminOrder, nextStatus: OrderStatus) {
    if (nextStatus === order.status) return;
    let cancelledReason: string | undefined;
    if (nextStatus === "cancelled") {
      const reason = window.prompt(`Отмена заказа ${order.order_number}. Укажите причину:`);
      if (reason === null) return;
      if (reason.trim().length < 3) return window.alert("Для отмены нужна причина не короче 3 символов.");
      cancelledReason = reason.trim();
    }

    setUpdatingId(order.id);
    try {
      const response = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus, cancelledReason }),
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "Не удалось изменить статус.");
        return;
      }
      await loadOrders(true);
    } catch {
      setError("Нет связи с сервером.");
    } finally {
      setUpdatingId("");
    }
  }

  const currentCount = useMemo(() => orders.filter((order) => !["delivered", "cancelled"].includes(order.status)).length, [orders]);

  return (
    <section aria-labelledby="orders-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h2 id="orders-title" className="text-2xl font-extrabold tracking-tight text-zinc-950">Заказы</h2><p className="mt-1 text-sm text-zinc-500">{currentCount} текущих · автообновление каждые 10 секунд</p></div>
        <div className="flex gap-2">
          <button type="button" onClick={() => void toggleSound()} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-3 text-sm font-bold text-zinc-700 ring-1 ring-zinc-200">{soundEnabled ? <Volume2 size={17} /> : <VolumeX size={17} />}{soundEnabled ? "Звук включён" : "Включить звук"}</button>
          <button type="button" onClick={() => void loadOrders()} aria-label="Обновить заказы" className="grid size-11 place-items-center rounded-xl bg-white text-zinc-700 ring-1 ring-zinc-200"><RefreshCw size={17} className={refreshing ? "animate-spin" : ""} /></button>
        </div>
      </div>

      {notice ? <button type="button" onClick={() => setNotice("")} className="mt-4 flex w-full items-center gap-3 rounded-2xl bg-orange-100 px-4 py-3 text-left text-sm font-bold text-orange-900" role="alert"><BellRing size={19} />{notice}<span className="ml-auto text-xs">Скрыть</span></button> : null}
      {error ? <p role="alert" className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      <div className="mt-5 grid gap-3 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-zinc-950/5 sm:grid-cols-[1fr_180px_170px]">
        <label className="relative block"><span className="sr-only">Поиск заказов</span><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Номер, имя или телефон" className="h-11 w-full rounded-xl border border-zinc-200 pl-10 pr-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" /></label>
        <select aria-label="Фильтр по статусу" value={status} onChange={(event) => setStatus(event.target.value)} className="h-11 min-w-0 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none"><option value="">Все статусы</option>{orderStatuses.map((value) => <option key={value} value={value}>{orderStatusLabels[value]}</option>)}</select>
        <input aria-label="Фильтр по дате" type="date" value={date} onChange={(event) => setDate(event.target.value)} className="h-11 min-w-0 rounded-xl border border-zinc-200 px-3 text-sm outline-none" />
      </div>

      {loading ? <div className="mt-8 flex items-center justify-center gap-2 py-12 text-sm text-zinc-500"><LoaderCircle className="animate-spin" size={19} />Загружаем заказы…</div> : orders.length ? <div className="mt-5 grid gap-4 xl:grid-cols-2">{orders.map((order) => <OrderCard key={order.id} order={order} updating={updatingId === order.id} onStatus={(next) => void changeStatus(order, next)} />)}</div> : <div className="mt-5 rounded-3xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center"><p className="font-bold text-zinc-900">Заказов по этим условиям нет</p><p className="mt-2 text-sm text-zinc-500">Новые заказы появятся здесь автоматически.</p></div>}
    </section>
  );
}

function OrderCard({ order, updating, onStatus }: { order: AdminOrder; updating: boolean; onStatus: (status: OrderStatus) => void }) {
  const options = orderStatuses.filter((status) => canTransitionOrderStatus(order.status, status));
  return <article className={`min-w-0 rounded-3xl bg-white p-4 shadow-sm ring-1 sm:p-5 ${order.status === "new" ? "ring-2 ring-orange-400" : "ring-zinc-950/5"}`}>
    <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><h3 className="text-lg font-extrabold text-zinc-950">{order.order_number}</h3><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${order.status === "new" ? "bg-orange-100 text-orange-800" : order.status === "cancelled" ? "bg-red-100 text-red-700" : "bg-zinc-100 text-zinc-700"}`}>{orderStatusLabels[order.status]}</span></div><p className="mt-1 text-xs text-zinc-500">{new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(order.created_at))}</p></div><p className="text-xl font-extrabold text-orange-600">{formatPrice(order.total)}</p></div>
    <div className="mt-4 grid gap-2 rounded-2xl bg-zinc-50 p-3 text-sm text-zinc-700 sm:grid-cols-2"><p><strong>{order.customer_name}</strong><br /><a href={`tel:${order.customer_phone}`} className="underline underline-offset-2">{order.customer_phone}</a></p><p>{order.fulfillment_method === "delivery" ? `Доставка · ${order.delivery_zone_name ?? "зона не указана"}` : "Самовывоз"}<br />{order.delivery_address}</p><p>Оплата: {order.payment_method === "cash" ? "наличными" : "переводом"}</p><p>{order.promo_code ? `Промокод: ${order.promo_code}` : "Без промокода"}</p></div>
    <ul className="mt-4 space-y-3">{order.order_items.map((item) => <li key={item.id} className="border-b border-zinc-100 pb-3 last:border-0"><div className="flex justify-between gap-3 text-sm"><span className="font-bold text-zinc-900">{item.item_name} × {item.quantity}</span><span className="shrink-0 font-bold">{formatPrice(item.line_total)}</span></div>{item.modifiers.length ? <p className="mt-1 text-xs text-zinc-500">{item.modifiers.map((modifier) => modifier.name).join(", ")}</p> : null}{item.item_comment ? <p className="mt-1 text-xs text-zinc-500">Комментарий: {item.item_comment}</p> : null}</li>)}</ul>
    {order.order_comment ? <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900"><strong>Комментарий:</strong> {order.order_comment}</p> : null}
    <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
      <select aria-label={`Статус заказа ${order.order_number}`} disabled={updating || options.length <= 1} value={order.status} onChange={(event) => onStatus(event.target.value as OrderStatus)} className="h-11 min-w-0 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-bold outline-none disabled:opacity-60">{options.map((status) => <option key={status} value={status}>{orderStatusLabels[status]}</option>)}</select>
      <Link href={`/admin/orders/${order.id}/print`} target="_blank" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-zinc-200 px-4 text-sm font-bold text-zinc-700"><Printer size={17} />Печать</Link>
    </div>
    {order.cancelled_reason ? <p className="mt-3 text-xs text-red-600">Причина отмены: {order.cancelled_reason}</p> : null}
  </article>;
}

