"use client";

import Image from "next/image";
import { Minus, Plus } from "lucide-react";
import { useState, type MouseEvent } from "react";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/store/cart-store";
import type { MenuItem } from "@/types/menu";

export function DishCard({ item, onOpen, viewMode = "grid" }: { item: MenuItem; onOpen: (item: MenuItem) => void; viewMode?: "grid" | "list" }) {
  const { lines, addItem, updateQuantity } = useCart();
  const [imageSrc, setImageSrc] = useState(item.image_url || "/menu-placeholder.svg");
  const quickLine = lines.find((line) => line.item.id === item.id && line.selectedOptions.length === 0 && !line.comment);
  const isList = viewMode === "list";

  function addQuickly(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    if (!item.is_available) return;
    addItem({ item, quantity: 1, selectedOptions: [], comment: "" });
  }

  function changeQuickQuantity(event: MouseEvent<HTMLButtonElement>, quantity: number) {
    event.stopPropagation();
    if (!quickLine) return;
    updateQuantity(quickLine.key, quantity);
  }

  return (
    <article
      data-dish-id={item.id}
      className={`group relative min-w-0 overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-zinc-950/5 transition duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-zinc-950/8 focus-within:ring-2 focus-within:ring-orange-400 dark:bg-zinc-900 dark:ring-white/10 ${isList ? "flex min-h-36" : ""}`}
      onClick={() => onOpen(item)}
    >
      <div className={`pointer-events-none relative shrink-0 overflow-hidden bg-zinc-100 ${isList ? "w-32 sm:w-40" : "aspect-[1.35]"}`}>
        <Image
          src={imageSrc}
          alt={item.name}
          fill
          sizes={isList ? "160px" : "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 260px"}
          loading="lazy"
          className={`object-cover transition duration-500 group-hover:scale-105 ${item.is_available ? "" : "grayscale-[35%] opacity-75"}`}
          onError={() => setImageSrc("/menu-placeholder.svg")}
        />
        <div className="absolute inset-x-3 top-3 flex gap-2">
          {!item.is_available ? <span className="rounded-full bg-red-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">Нет в наличии</span> : null}
          {item.is_popular ? <span className="rounded-full bg-zinc-950/85 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur">Популярное</span> : null}
          {item.is_new ? <span className="rounded-full bg-orange-500 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">Новинка</span> : null}
        </div>
      </div>
      <div className={`pointer-events-none min-w-0 flex-1 p-3.5 sm:p-4 ${isList ? "flex flex-col justify-between" : ""}`}>
        <div className="flex items-start justify-between gap-2">
          <h3 className={`${isList ? "line-clamp-2" : "line-clamp-1"} text-[15px] font-bold leading-5 text-zinc-950 dark:text-white sm:text-base`}>{item.name}</h3>
          <span className="shrink-0 text-sm font-extrabold text-orange-600">{formatPrice(item.price)}</span>
        </div>
        <p className={`mt-1 line-clamp-2 text-xs leading-5 text-zinc-500 dark:text-zinc-400 ${isList ? "" : "min-h-10"}`}>{item.description || "Аппетитное блюдо от B-Bay."}</p>
        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-zinc-400">{item.weight || "—"}</span>
          {quickLine ? <div className="pointer-events-auto relative z-20 inline-flex items-center gap-1 rounded-xl bg-orange-500 p-1 text-white shadow-lg shadow-orange-500/20"><button type="button" aria-label={`Уменьшить количество ${item.name}`} disabled={quickLine.quantity <= 1} onClick={(event) => changeQuickQuantity(event, quickLine.quantity - 1)} className="grid size-11 place-items-center rounded-lg transition hover:bg-white/15 disabled:opacity-50"><Minus size={15} /></button><span className="min-w-5 text-center text-sm font-extrabold">{quickLine.quantity}</span><button type="button" aria-label={`Увеличить количество ${item.name}`} disabled={quickLine.quantity >= 99} onClick={(event) => changeQuickQuantity(event, quickLine.quantity + 1)} className="grid size-11 place-items-center rounded-lg transition hover:bg-white/15 disabled:opacity-50"><Plus size={15} /></button></div> : <button
              type="button"
              aria-label={item.is_available ? `Добавить ${item.name} в корзину` : `${item.name} нет в наличии`}
              disabled={!item.is_available}
              className="pointer-events-auto relative z-20 grid size-11 place-items-center rounded-xl bg-orange-500 text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:shadow-none dark:disabled:bg-zinc-700"
              onClick={addQuickly}
            >
              <Plus size={19} />
            </button>}
        </div>
      </div>
      <button type="button" aria-label={`Открыть подробности: ${item.name}`} onClick={(event) => { event.stopPropagation(); onOpen(item); }} className="absolute inset-0 z-10 block h-full w-full cursor-pointer rounded-3xl" />
    </article>
  );
}
