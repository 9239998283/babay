"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, PackageOpen, Trash2 } from "lucide-react";
import { useState } from "react";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { EmptyState } from "@/components/ui/empty-state";
import { QuantityControl } from "@/components/ui/quantity-control";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { formatPrice } from "@/lib/format";
import { cartLinePrice } from "@/lib/whatsapp";
import { useCart } from "@/store/cart-store";

export function CartPage() {
  const { lines, orderComment, updateQuantity, removeItem, setOrderComment, clearCart } = useCart();

  return <main className="min-h-dvh bg-[#f7f7f6] pb-16 transition-colors dark:bg-zinc-950"><div className="mx-auto max-w-3xl px-4 py-5 sm:px-6 sm:py-8"><div className="flex items-center justify-between gap-3"><Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-zinc-600 transition hover:text-orange-600 dark:text-zinc-300"><ArrowLeft size={18} />К меню</Link><ThemeToggle /></div><div className="mt-5 flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-orange-600">Ваш заказ</p><h1 className="mt-1 text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-white">Корзина</h1></div>{lines.length ? <button type="button" onClick={clearCart} className="inline-flex items-center gap-1.5 text-sm font-bold text-red-600 transition hover:text-red-700 dark:text-red-400"><Trash2 size={16} />Очистить</button> : null}</div>

    {!lines.length ? <div className="mt-8"><EmptyState icon={<PackageOpen size={23} />} title="Корзина пока пуста" description="Добавьте блюда из меню — здесь появится ваш заказ." action={<Link href="/" className="inline-flex h-11 items-center justify-center rounded-xl bg-orange-500 px-4 text-sm font-bold text-white hover:bg-orange-600">Перейти к меню</Link>} /></div> : <><div className="mt-6 space-y-3">{lines.map((line) => <article key={line.key} className="flex gap-3 rounded-3xl bg-white p-3 shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-900 dark:ring-white/10 sm:p-4"><CartItemImage name={line.item.name} imageUrl={line.item.image_url} /><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><div><h2 className="font-bold text-zinc-950 dark:text-white">{line.item.name}</h2>{line.selectedOptions.length ? <p className="mt-0.5 text-xs leading-5 text-zinc-500 dark:text-zinc-400">{line.selectedOptions.map((option) => option.name).join(", ")}</p> : null}{line.comment ? <p className="text-xs leading-5 text-zinc-500 dark:text-zinc-400">{line.comment}</p> : null}</div><button aria-label={`Удалить ${line.item.name}`} type="button" onClick={() => removeItem(line.key)} className="grid size-8 place-items-center rounded-lg text-zinc-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"><Trash2 size={17} /></button></div><div className="mt-3 flex items-center justify-between gap-3"><QuantityControl size="sm" quantity={line.quantity} onChange={(quantity) => updateQuantity(line.key, quantity)} /><p className="text-sm font-extrabold text-zinc-950 dark:text-white">{formatPrice(cartLinePrice(line))}</p></div></div></article>)}</div>
      <label className="mt-5 block rounded-3xl bg-white p-4 shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-900 dark:ring-white/10"><span className="text-sm font-bold text-zinc-950 dark:text-white">Комментарий к заказу</span><textarea value={orderComment} onChange={(event) => setOrderComment(event.target.value)} maxLength={500} rows={3} placeholder="Например, позвоните по прибытии" className="mt-3 w-full resize-none bg-transparent text-sm leading-6 text-zinc-950 outline-none placeholder:text-zinc-400 dark:text-white" /></label>
      <CheckoutForm embedded />
    </>}</div></main>;
}

function CartItemImage({ name, imageUrl }: { name: string; imageUrl: string | null }) {
  const [source, setSource] = useState(imageUrl || "/menu-placeholder.svg");

  return (
    <div className="relative size-20 shrink-0 overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-800 sm:size-24">
      <Image
        src={source}
        alt={name}
        fill
        sizes="96px"
        className="object-cover"
        onError={() => setSource("/menu-placeholder.svg")}
      />
    </div>
  );
}
