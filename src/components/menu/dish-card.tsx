"use client";

import Image from "next/image";
import { Plus } from "lucide-react";
import { useState } from "react";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/store/cart-store";
import type { MenuItem } from "@/types/menu";

export function DishCard({ item, onOpen }: { item: MenuItem; onOpen: (item: MenuItem) => void }) {
  const { addItem } = useCart();
  const [imageSrc, setImageSrc] = useState(item.image_url || "/menu-placeholder.svg");

  function addQuickly(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    if (!item.is_available) return;
    addItem({ item, quantity: 1, selectedOptions: [], comment: "" });
  }

  return (
    <article
      className="group relative min-w-0 cursor-pointer overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-zinc-950/5 transition duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-zinc-950/8 focus-within:ring-2 focus-within:ring-orange-400 dark:bg-zinc-900 dark:ring-white/10"
      onClick={() => onOpen(item)}
    >
      <div className="relative aspect-[1.35] overflow-hidden bg-zinc-100">
        <Image
          src={imageSrc}
          alt={item.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 260px"
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
      <div className="p-3.5 sm:p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 text-[15px] font-bold leading-5 text-zinc-950 dark:text-white sm:text-base">{item.name}</h3>
          <span className="shrink-0 text-sm font-extrabold text-orange-600">{formatPrice(item.price)}</span>
        </div>
        <p className="mt-1 line-clamp-2 min-h-10 text-xs leading-5 text-zinc-500 dark:text-zinc-400">{item.description || "Аппетитное блюдо от B-Bay."}</p>
        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-zinc-400">{item.weight || "—"}</span>
          <button
            type="button"
            aria-label={item.is_available ? `Добавить ${item.name} в корзину` : `${item.name} нет в наличии`}
            disabled={!item.is_available}
            className="grid size-9 place-items-center rounded-xl bg-orange-500 text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:shadow-none dark:disabled:bg-zinc-700"
            onClick={addQuickly}
          >
            <Plus size={19} />
          </button>
        </div>
      </div>
    </article>
  );
}
