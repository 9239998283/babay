"use client";

import Image from "next/image";
import { Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { QuantityControl } from "@/components/ui/quantity-control";
import { formatPrice } from "@/lib/format";
import { useLockBodyScroll } from "@/hooks/use-lock-body-scroll";
import { useCart } from "@/store/cart-store";
import type { MenuItem, MenuOption } from "@/types/menu";

export function DishDetailsDialog({ item, onClose }: { item: MenuItem; onClose: () => void }) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<MenuOption[]>([]);
  const [comment, setComment] = useState("");
  const [added, setAdded] = useState(false);
  const [imageSrc, setImageSrc] = useState(item.image_url || "/menu-placeholder.svg");
  const optionsTotal = selectedOptions.reduce((sum, option) => sum + option.price, 0);

  useLockBodyScroll(true);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  function toggleOption(option: MenuOption) {
    setSelectedOptions((current) =>
      current.some((selected) => selected.id === option.id)
        ? current.filter((selected) => selected.id !== option.id)
        : [...current, option],
    );
  }

  function addToCart() {
    addItem({ item, quantity, selectedOptions, comment: comment.trim() });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-zinc-950/50 p-0 backdrop-blur-sm sm:items-center sm:justify-center sm:p-6" role="dialog" aria-modal="true" aria-label={item.name}>
      <button aria-label="Закрыть окно" className="absolute inset-0 cursor-default" onClick={onClose} />
      <section className="relative max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-t-[2rem] bg-white shadow-2xl sm:rounded-[2rem]">
        <div className="relative aspect-[1.55] overflow-hidden bg-zinc-100">
          <Image src={imageSrc} alt={item.name} fill priority sizes="(max-width: 700px) 100vw, 680px" className="object-cover" onError={() => setImageSrc("/menu-placeholder.svg")} />
          <button type="button" aria-label="Закрыть" onClick={onClose} className="absolute right-4 top-4 grid size-10 place-items-center rounded-full bg-white/90 text-zinc-800 shadow-sm transition hover:bg-white">
            <X size={20} />
          </button>
        </div>
        <div className="p-5 pb-6 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-zinc-950">{item.name}</h2>
              {item.weight ? <p className="mt-1 text-sm font-medium text-zinc-400">{item.weight}</p> : null}
            </div>
            <p className="shrink-0 text-xl font-extrabold text-orange-600">{formatPrice(item.price)}</p>
          </div>
          <p className="mt-4 text-sm leading-6 text-zinc-600">{item.description || "Аппетитное блюдо от B-Bay."}</p>
          {item.composition ? <div className="mt-5 rounded-2xl bg-zinc-50 p-4"><h3 className="text-sm font-bold text-zinc-950">Состав</h3><p className="mt-1.5 text-sm leading-6 text-zinc-600">{item.composition}</p></div> : null}

          {item.options?.length ? (
            <fieldset className="mt-6">
              <legend className="text-sm font-bold text-zinc-950">Добавить к блюду</legend>
              <div className="mt-3 space-y-2">
                {item.options.map((option) => {
                  const checked = selectedOptions.some((selected) => selected.id === option.id);
                  return <label key={option.id} className="flex cursor-pointer items-center justify-between rounded-xl border border-zinc-200 px-3.5 py-3 transition has-[:checked]:border-orange-400 has-[:checked]:bg-orange-50"><span className="flex items-center gap-3 text-sm font-medium text-zinc-800"><input type="checkbox" checked={checked} onChange={() => toggleOption(option)} className="size-4 accent-orange-500" />{option.name}</span><span className="text-sm font-bold text-zinc-500">+{formatPrice(option.price)}</span></label>;
                })}
              </div>
            </fieldset>
          ) : null}

          <label className="mt-6 block text-sm font-bold text-zinc-950">Комментарий к блюду<textarea value={comment} onChange={(event) => setComment(event.target.value)} maxLength={250} rows={2} placeholder="Например, без лука" className="mt-2 w-full resize-none rounded-xl border border-zinc-200 bg-white px-3.5 py-3 text-sm font-normal outline-none transition placeholder:text-zinc-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100" /></label>
          <div className="mt-6 flex items-center gap-3 border-t border-zinc-100 pt-5">
            <QuantityControl quantity={quantity} onChange={setQuantity} />
            <Button className="flex-1" size="lg" onClick={addToCart}>{added ? "Добавлено" : <><Plus size={18} /> В корзину · {formatPrice((item.price + optionsTotal) * quantity)}</>}</Button>
          </div>
        </div>
      </section>
    </div>
  );
}
