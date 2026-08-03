"use client";

import Link from "next/link";
import { Clock3, MapPin, MessageCircle, Search, ShoppingBag, Star, Sparkles, UtensilsCrossed } from "lucide-react";
import { useDeferredValue, useMemo, useState, type ReactNode } from "react";
import { DishCard } from "./dish-card";
import { DishDetailsDialog } from "./dish-details-dialog";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { makeWhatsAppLink } from "@/lib/whatsapp";
import { useCart } from "@/store/cart-store";
import type { Category, MenuItem } from "@/types/menu";

function getOpenStatus() {
  const hour = Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Moscow", hour: "2-digit", hourCycle: "h23" }).format(new Date()));
  return hour >= 10 && hour < 23;
}

function SectionHeading({ icon, title, subtitle }: { icon: ReactNode; title: string; subtitle?: string }) {
  return <div className="mb-4 flex items-end justify-between gap-3"><div><div className="flex items-center gap-2 text-orange-600">{icon}<span className="text-xs font-bold uppercase tracking-[0.14em]">B-Bay рекомендует</span></div><h2 className="mt-1 text-xl font-extrabold tracking-tight text-zinc-950 dark:text-white sm:text-2xl">{title}</h2></div>{subtitle ? <span className="pb-1 text-sm text-zinc-500 dark:text-zinc-400">{subtitle}</span> : null}</div>;
}

function CartButton() {
  const { count, total } = useCart();
  if (count === 0) return null;
  return <Link href="/cart" className="fixed bottom-20 left-4 right-4 z-40 mx-auto flex max-w-2xl items-center justify-between rounded-2xl bg-zinc-950 px-5 py-3.5 text-white shadow-2xl shadow-zinc-950/25 transition hover:-translate-y-0.5 dark:bg-white dark:text-zinc-950 sm:bottom-6"><span className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-orange-500 text-white"><ShoppingBag size={18} /></span><span className="font-bold">Корзина <span className="text-zinc-400">· {count} шт.</span></span></span><span className="font-extrabold">{new Intl.NumberFormat("ru-RU").format(total)} ₽</span></Link>;
}

export function MenuHome({ categories, items, isDemo }: { categories: Category[]; items: MenuItem[]; isDemo: boolean }) {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());
  const isOpen = getOpenStatus();
  const whatsAppLink = makeWhatsAppLink("Здравствуйте! Хочу уточнить информацию по меню B-Bay.");

  const filteredItems = useMemo(() => items.filter((item) => {
    const categoryMatches = activeCategory === "all" || item.category_id === activeCategory;
    const searchMatches = !deferredQuery || [item.name, item.description, item.composition].filter(Boolean).join(" ").toLowerCase().includes(deferredQuery);
    return categoryMatches && searchMatches;
  }), [items, activeCategory, deferredQuery]);
  const showHighlights = activeCategory === "all" && !deferredQuery;
  const popular = items.filter((item) => item.is_available && item.is_popular).slice(0, 4);
  const newItems = items.filter((item) => item.is_available && item.is_new).slice(0, 4);

  return <main className="min-h-dvh bg-[#f7f7f6] pb-36 text-zinc-900 transition-colors dark:bg-zinc-950 dark:text-zinc-100"><div className="mx-auto max-w-6xl px-4 pb-7 pt-4 sm:px-6 sm:pt-6">
    <header className="rounded-[2rem] bg-zinc-950 px-5 pb-5 pt-5 text-white shadow-xl shadow-zinc-950/10 sm:px-7 sm:pb-7">
      <div className="flex items-start justify-between gap-4"><div className="flex items-center gap-3"><div className="grid size-12 place-items-center rounded-2xl bg-orange-500 text-lg font-black italic shadow-lg shadow-orange-500/30">B</div><div><p className="text-lg font-extrabold tracking-tight">B-Bay <span className="font-medium text-zinc-400">«Бабай»</span></p><p className="mt-0.5 text-xs text-zinc-400">Вкус, к которому хочется вернуться</p></div></div><span className={`rounded-full px-3 py-1.5 text-xs font-bold ${isOpen ? "bg-emerald-400/15 text-emerald-300" : "bg-red-400/15 text-red-300"}`}><span className={`mr-1.5 inline-block size-1.5 rounded-full ${isOpen ? "bg-emerald-400" : "bg-red-400"}`} />{isOpen ? "Открыто" : "Закрыто"}</span></div>
      <div className="mt-6 grid gap-2 text-sm text-zinc-300 sm:grid-cols-2"><p className="flex items-center gap-2"><Clock3 size={16} className="text-orange-400" />Ежедневно, 10:00–23:00</p><p className="flex items-center gap-2"><MapPin size={16} className="text-orange-400" />Грозный, центр города</p></div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3"><a href={whatsAppLink ?? undefined} target="_blank" rel="noreferrer" aria-disabled={!whatsAppLink} className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-zinc-950 transition hover:bg-orange-50 aria-disabled:pointer-events-none aria-disabled:opacity-50"><MessageCircle size={17} className="text-emerald-600" />Связаться в WhatsApp</a><ThemeToggle /></div>
    </header>

    {isDemo ? <div className="mt-4 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm leading-5 text-orange-900"><strong>Демонстрационное меню.</strong> Подключите Supabase по инструкции в README, чтобы управлять блюдами и фотографиями.</div> : null}
    <div className="relative mt-5"><Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-zinc-400" /><input value={query} onChange={(event) => { setQuery(event.target.value); setActiveCategory("all"); }} placeholder="Поиск по меню" className="h-13 w-full rounded-2xl border border-zinc-200 bg-white pl-12 pr-4 text-base text-zinc-950 outline-none shadow-sm transition placeholder:text-zinc-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:ring-orange-950" /></div>
  </div>

  <nav aria-label="Категории меню" className="sticky top-0 z-30 border-y border-zinc-200/80 bg-[#f7f7f6]/95 py-3 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95"><div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 [scrollbar-width:none] sm:px-6"><button onClick={() => { setActiveCategory("all"); setQuery(""); }} className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition ${activeCategory === "all" && !query ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950" : "bg-white text-zinc-600 ring-1 ring-zinc-200 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-300 dark:ring-zinc-700 dark:hover:bg-zinc-800"}`}>Все</button>{categories.filter((category) => category.is_active).map((category) => <button key={category.id} onClick={() => { setActiveCategory(category.id); setQuery(""); }} className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition ${activeCategory === category.id ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950" : "bg-white text-zinc-600 ring-1 ring-zinc-200 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-300 dark:ring-zinc-700 dark:hover:bg-zinc-800"}`}>{category.name}</button>)}</div></nav>

  <div className="mx-auto max-w-6xl px-4 pt-7 sm:px-6">
    {showHighlights && popular.length ? <section data-section="popular"><SectionHeading icon={<Star size={15} fill="currentColor" />} title="Популярное" /><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{popular.map((item) => <DishCard key={item.id} item={item} onOpen={setSelectedItem} />)}</div></section> : null}
    {showHighlights && newItems.length ? <section data-section="new" className="mt-9"><SectionHeading icon={<Sparkles size={16} />} title="Новинки" /><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{newItems.map((item) => <DishCard key={item.id} item={item} onOpen={setSelectedItem} />)}</div></section> : null}
    <section data-section="menu" className={showHighlights ? "mt-9" : ""}><SectionHeading icon={<UtensilsCrossed size={16} />} title={deferredQuery ? "Результаты поиска" : activeCategory === "all" ? "Всё меню" : categories.find((category) => category.id === activeCategory)?.name ?? "Меню"} subtitle={`${filteredItems.length} поз.`} />
      {filteredItems.length ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{filteredItems.map((item) => <DishCard key={item.id} item={item} onOpen={setSelectedItem} />)}</div> : <div className="rounded-3xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center dark:border-zinc-700 dark:bg-zinc-900"><p className="font-bold text-zinc-950 dark:text-white">Ничего не нашли</p><p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Попробуйте изменить запрос или выбрать другую категорию.</p></div>}
    </section>
  </div>
  <CartButton />
  <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/95 sm:hidden"><div className="mx-auto flex max-w-md items-center justify-around px-4 py-2"><Link href="/" className="flex flex-col items-center gap-1 p-1 text-xs font-bold text-orange-600"><UtensilsCrossed size={20} />Меню</Link><Link href="/cart" className="flex flex-col items-center gap-1 p-1 text-xs font-medium text-zinc-500 dark:text-zinc-400"><ShoppingBag size={20} />Корзина</Link><a href={whatsAppLink ?? undefined} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-1 p-1 text-xs font-medium text-zinc-500 dark:text-zinc-400"><MessageCircle size={20} />Связь</a></div></nav>
  {selectedItem ? <DishDetailsDialog item={selectedItem} onClose={() => setSelectedItem(null)} /> : null}
  </main>;
}
