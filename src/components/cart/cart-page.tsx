"use client";

import Link from "next/link";
import { ArrowLeft, PackageOpen, ShoppingBag, Trash2 } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { QuantityControl } from "@/components/ui/quantity-control";
import { formatPrice } from "@/lib/format";
import { cartLinePrice } from "@/lib/whatsapp";
import { useCart } from "@/store/cart-store";

export function CartPage() {
  const { lines, orderComment, total, count, updateQuantity, removeItem, setOrderComment, clearCart } = useCart();

  return <main className="min-h-dvh bg-[#f7f7f6] pb-32"><div className="mx-auto max-w-3xl px-4 py-5 sm:px-6 sm:py-8"><Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-zinc-600 transition hover:text-orange-600"><ArrowLeft size={18} />К меню</Link><div className="mt-5 flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-orange-600">Ваш заказ</p><h1 className="mt-1 text-3xl font-extrabold tracking-tight text-zinc-950">Корзина</h1></div>{lines.length ? <button type="button" onClick={clearCart} className="inline-flex items-center gap-1.5 text-sm font-bold text-red-600 transition hover:text-red-700"><Trash2 size={16} />Очистить</button> : null}</div>

    {!lines.length ? <div className="mt-8"><EmptyState icon={<PackageOpen size={23} />} title="Корзина пока пуста" description="Добавьте блюда из меню — здесь появится ваш заказ." action={<Link href="/" className="inline-flex h-11 items-center justify-center rounded-xl bg-orange-500 px-4 text-sm font-bold text-white hover:bg-orange-600">Перейти к меню</Link>} /></div> : <><div className="mt-6 space-y-3">{lines.map((line) => <article key={line.key} className="flex gap-3 rounded-3xl bg-white p-3 shadow-sm ring-1 ring-zinc-950/5 sm:p-4"><div className="grid size-16 shrink-0 place-items-center rounded-2xl bg-orange-50 text-orange-600"><ShoppingBag size={23} /></div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><div><h2 className="font-bold text-zinc-950">{line.item.name}</h2>{line.selectedOptions.length ? <p className="mt-0.5 text-xs leading-5 text-zinc-500">{line.selectedOptions.map((option) => option.name).join(", ")}</p> : null}{line.comment ? <p className="text-xs leading-5 text-zinc-500">{line.comment}</p> : null}</div><button aria-label={`Удалить ${line.item.name}`} type="button" onClick={() => removeItem(line.key)} className="grid size-8 place-items-center rounded-lg text-zinc-400 transition hover:bg-red-50 hover:text-red-600"><Trash2 size={17} /></button></div><div className="mt-3 flex items-center justify-between gap-3"><QuantityControl size="sm" quantity={line.quantity} onChange={(quantity) => updateQuantity(line.key, quantity)} /><p className="text-sm font-extrabold text-zinc-950">{formatPrice(cartLinePrice(line))}</p></div></div></article>)}</div>
      <label className="mt-5 block rounded-3xl bg-white p-4 shadow-sm ring-1 ring-zinc-950/5"><span className="text-sm font-bold text-zinc-950">Комментарий к заказу</span><textarea value={orderComment} onChange={(event) => setOrderComment(event.target.value)} maxLength={500} rows={3} placeholder="Например, позвоните по прибытии" className="mt-3 w-full resize-none bg-transparent text-sm leading-6 outline-none placeholder:text-zinc-400" /></label>
      <section className="mt-5 rounded-3xl bg-zinc-950 p-5 text-white shadow-xl shadow-zinc-950/10"><div className="flex items-center justify-between text-sm text-zinc-400"><span>Позиций: {count}</span><span>К оплате в кафе</span></div><div className="mt-2 flex items-end justify-between"><h2 className="text-lg font-bold">Итого</h2><p className="text-3xl font-extrabold">{formatPrice(total)}</p></div><Link href="/checkout" className="mt-5 flex h-12 items-center justify-center gap-2 rounded-xl bg-orange-500 text-sm font-bold text-white transition hover:bg-orange-600"><ShoppingBag size={18} />Оформить через WhatsApp</Link></section>
    </>}</div></main>;
}
