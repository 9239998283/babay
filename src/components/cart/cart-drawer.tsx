"use client";

import Image from "next/image";
import { PackageOpen, Trash2, X } from "lucide-react";
import { useState } from "react";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { QuantityControl } from "@/components/ui/quantity-control";
import { useLockBodyScroll } from "@/hooks/use-lock-body-scroll";
import { useModalDialog } from "@/hooks/use-modal-dialog";
import { formatPrice } from "@/lib/format";
import { cartLinePrice } from "@/lib/whatsapp";
import { useCart } from "@/store/cart-store";

export function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { lines, count, total, orderComment, updateQuantity, removeItem, setOrderComment, clearCart } = useCart();

  useLockBodyScroll(open);
  const dialogRef = useModalDialog<HTMLElement>(open, onClose);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex justify-end bg-zinc-950/55 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Корзина">
      <button type="button" aria-label="Закрыть корзину" className="absolute inset-0 cursor-default" onClick={onClose} />
      <section ref={dialogRef} tabIndex={-1} className="relative h-dvh w-full max-w-2xl overflow-y-auto bg-[#f7f7f6] shadow-2xl dark:bg-zinc-950">
        <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-zinc-200/80 bg-[#f7f7f6]/95 px-4 py-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95 sm:px-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-orange-600">Ваш заказ</p>
            <h2 className="mt-0.5 text-2xl font-extrabold tracking-tight text-zinc-950 dark:text-white">Корзина {count ? <span className="text-zinc-400">· {count}</span> : null}</h2>
          </div>
          <button type="button" aria-label="Закрыть" onClick={onClose} className="grid size-11 place-items-center rounded-2xl bg-white text-zinc-700 shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-900 dark:text-zinc-200 dark:ring-white/10"><X size={20} /></button>
        </header>

        <div className="px-4 pb-10 pt-5 sm:px-6">
          {!lines.length ? <div className="rounded-3xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center dark:border-zinc-700 dark:bg-zinc-900"><span className="mx-auto grid size-12 place-items-center rounded-2xl bg-orange-50 text-orange-600 dark:bg-orange-950/40"><PackageOpen size={23} /></span><p className="mt-4 font-bold text-zinc-950 dark:text-white">Корзина пока пуста</p><p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Закройте корзину и добавьте блюда из меню.</p><button type="button" onClick={onClose} className="mt-5 h-11 rounded-xl bg-orange-500 px-5 text-sm font-bold text-white transition hover:bg-orange-600">Вернуться в меню</button></div> : <>
            <div className="flex items-center justify-between gap-3"><p className="text-sm font-bold text-zinc-950 dark:text-white">{lines.length} {lines.length === 1 ? "позиция" : "позиции"} · {formatPrice(total)}</p><button type="button" onClick={clearCart} className="inline-flex items-center gap-1.5 text-sm font-bold text-red-600 dark:text-red-400"><Trash2 size={16} />Очистить</button></div>
            <div className="mt-4 space-y-3">{lines.map((line) => <article key={line.key} className="flex gap-3 rounded-3xl bg-white p-3 shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-900 dark:ring-white/10 sm:p-4"><CartDrawerImage name={line.item.name} imageUrl={line.item.image_url} /><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><div><h3 className="font-bold text-zinc-950 dark:text-white">{line.item.name}</h3>{line.selectedOptions.length ? <p className="mt-0.5 text-xs leading-5 text-zinc-500 dark:text-zinc-400">{line.selectedOptions.map((option) => option.name).join(", ")}</p> : null}{line.comment ? <p className="text-xs leading-5 text-zinc-500 dark:text-zinc-400">{line.comment}</p> : null}</div><button type="button" aria-label={`Удалить ${line.item.name}`} onClick={() => removeItem(line.key)} className="grid size-8 place-items-center rounded-lg text-zinc-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"><Trash2 size={17} /></button></div><div className="mt-3 flex items-center justify-between gap-3"><QuantityControl size="sm" quantity={line.quantity} onChange={(quantity) => updateQuantity(line.key, quantity)} /><p className="text-sm font-extrabold text-zinc-950 dark:text-white">{formatPrice(cartLinePrice(line))}</p></div></div></article>)}</div>
            <label className="mt-5 block rounded-3xl bg-white p-4 shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-900 dark:ring-white/10"><span className="text-sm font-bold text-zinc-950 dark:text-white">Комментарий к заказу</span><textarea value={orderComment} onChange={(event) => setOrderComment(event.target.value)} maxLength={500} rows={3} placeholder="Например, позвоните по прибытии" className="mt-3 w-full resize-none bg-transparent text-sm leading-6 text-zinc-950 outline-none placeholder:text-zinc-400 dark:text-white" /></label>
            <CheckoutForm embedded />
          </>}
        </div>
      </section>
    </div>
  );
}

function CartDrawerImage({ name, imageUrl }: { name: string; imageUrl: string | null }) {
  const [source, setSource] = useState(imageUrl || "/menu-placeholder.svg");
  return <div className="relative size-20 shrink-0 overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-800 sm:size-24"><Image src={source} alt={name} fill sizes="96px" className="object-cover" onError={() => setSource("/menu-placeholder.svg")} /></div>;
}
