"use client";

import { Search, ShoppingBag, X } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";
import { useLockBodyScroll } from "@/hooks/use-lock-body-scroll";
import { useModalDialog } from "@/hooks/use-modal-dialog";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/store/cart-store";
import type { Category, MenuItem } from "@/types/menu";
import { DishCard } from "./dish-card";

type MenuSearchDialogProps = {
  open: boolean;
  categories: Category[];
  items: MenuItem[];
  onClose: () => void;
  onOpenItem: (item: MenuItem) => void;
  onOpenCart: () => void;
};

export function MenuSearchDialog({ open, categories, items, onClose, onOpenItem, onOpenCart }: MenuSearchDialogProps) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());
  const { count, total } = useCart();

  useLockBodyScroll(open);
  const dialogRef = useModalDialog<HTMLDivElement>(open, onClose);

  const visibleCategories = categories.filter((category) => category.is_active);
  const filteredItems = useMemo(() => items.filter((item) => {
    const categoryMatches = activeCategory === "all" || item.category_id === activeCategory;
    if (!categoryMatches) return false;
    if (!deferredQuery) return true;

    const categoryName = categories.find((category) => category.id === item.category_id)?.name ?? "";
    const haystack = [
      item.name,
      item.description,
      item.composition,
      item.weight,
      categoryName,
      ...(item.options ?? []).map((option) => option.name),
    ].filter(Boolean).join(" ").toLowerCase();
    return haystack.includes(deferredQuery);
  }), [activeCategory, categories, deferredQuery, items]);

  if (!open) return null;

  function openItem(item: MenuItem) {
    onClose();
    onOpenItem(item);
  }

  function openCart() {
    onClose();
    onOpenCart();
  }

  return (
    <div ref={dialogRef} tabIndex={-1} className="fixed inset-0 z-[60] overflow-y-auto bg-[#f7f7f6] text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100" role="dialog" aria-modal="true" aria-label="Поиск по меню">
      <header className="sticky top-0 z-10 border-b border-zinc-200/80 bg-[#f7f7f6]/95 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3 sm:px-6">
          <button type="button" aria-label="Закрыть поиск и вернуться в меню" onClick={onClose} className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white text-zinc-700 shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-900 dark:text-zinc-200 dark:ring-white/10"><X size={20} /></button>
          <label className="relative flex-1">
            <span className="sr-only">Поиск по меню</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-zinc-400" />
            <input data-autofocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Найти блюдо, состав или категорию" className="h-12 w-full rounded-2xl border border-zinc-200 bg-white pl-12 pr-4 text-base text-zinc-950 outline-none shadow-sm transition placeholder:text-zinc-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:ring-orange-950" />
          </label>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 pb-32 pt-6 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-orange-600">Быстрый поиск</p>
            <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-zinc-950 dark:text-white">Категории</h2>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{filteredItems.length} поз.</p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <button type="button" aria-pressed={activeCategory === "all"} onClick={() => setActiveCategory("all")} className={`rounded-2xl p-4 text-left transition ${activeCategory === "all" ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950" : "bg-white text-zinc-950 ring-1 ring-zinc-950/5 hover:ring-orange-300 dark:bg-zinc-900 dark:text-white dark:ring-white/10"}`}><span className="block font-bold">Все блюда</span><span className={`mt-1 block text-xs ${activeCategory === "all" ? "text-zinc-400" : "text-zinc-500 dark:text-zinc-400"}`}>{items.length} поз.</span></button>
          {visibleCategories.map((category) => {
            const categoryCount = items.filter((item) => item.category_id === category.id).length;
            const active = activeCategory === category.id;
            return <button key={category.id} type="button" aria-pressed={active} onClick={() => setActiveCategory(category.id)} className={`rounded-2xl p-4 text-left transition ${active ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950" : "bg-white text-zinc-950 ring-1 ring-zinc-950/5 hover:ring-orange-300 dark:bg-zinc-900 dark:text-white dark:ring-white/10"}`}><span className="block font-bold">{category.name}</span><span className={`mt-1 block text-xs ${active ? "text-zinc-400" : "text-zinc-500 dark:text-zinc-400"}`}>{categoryCount} поз.</span></button>;
          })}
        </div>

        <section className="mt-8">
          <h2 className="text-xl font-extrabold tracking-tight text-zinc-950 dark:text-white">{deferredQuery ? `Результаты «${query.trim()}»` : activeCategory === "all" ? "Всё меню" : visibleCategories.find((category) => category.id === activeCategory)?.name}</h2>
          {filteredItems.length ? <div className="mt-4 grid gap-3 sm:grid-cols-2">{filteredItems.map((item) => <DishCard key={item.id} item={item} viewMode="list" onOpen={openItem} />)}</div> : <div className="mt-4 rounded-3xl border border-dashed border-zinc-300 bg-white px-6 py-10 text-center dark:border-zinc-700 dark:bg-zinc-900"><p className="font-bold text-zinc-950 dark:text-white">Ничего не нашли</p><p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Попробуйте другое название или категорию.</p></div>}
        </section>
      </div>

      {count ? <button type="button" onClick={openCart} className="fixed bottom-5 left-4 right-4 z-20 mx-auto flex max-w-xl items-center justify-between rounded-2xl bg-orange-500 px-5 py-3.5 text-white shadow-2xl shadow-orange-500/30 transition hover:bg-orange-600"><span className="flex items-center gap-3 font-bold"><ShoppingBag size={19} />Корзина · {count}</span><span className="font-extrabold">{formatPrice(total)}</span></button> : null}
    </div>
  );
}
