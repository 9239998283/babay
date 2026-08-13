"use client";

import Link from "next/link";
import { ClipboardList, Clock3, LayoutGrid, List, MapPin, MessageCircle, Search, ShoppingBag, Star, Sparkles, UtensilsCrossed } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { DishCard } from "./dish-card";
import { DishDetailsDialog } from "./dish-details-dialog";
import { MenuSearchDialog } from "./menu-search-dialog";
import { OrderHistoryDialog } from "./order-history-dialog";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { makeWhatsAppLink } from "@/lib/whatsapp";
import { useCart } from "@/store/cart-store";
import type { Category, MenuItem } from "@/types/menu";

function getOpenStatus() {
  const hour = Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Moscow", hour: "2-digit", hourCycle: "h23" }).format(new Date()));
  return hour >= 10 && hour < 23;
}

function SectionHeading({ icon, eyebrow = "B-Bay рекомендует", title, subtitle }: { icon: ReactNode; eyebrow?: string; title: string; subtitle?: ReactNode }) {
  return <div className="mb-4 flex items-end justify-between gap-3"><div><div className="flex items-center gap-2 text-orange-600">{icon}<span className="text-xs font-bold uppercase tracking-[0.14em]">{eyebrow}</span></div><h2 className="mt-1 text-xl font-extrabold tracking-tight text-zinc-950 dark:text-white sm:text-2xl">{title}</h2></div>{subtitle ? <div className="pb-1 text-sm text-zinc-500 dark:text-zinc-400">{subtitle}</div> : null}</div>;
}

function CartButton({ onOpen }: { onOpen: () => void }) {
  const { count, total } = useCart();
  if (count === 0) return null;
  return <button type="button" onClick={onOpen} className="fixed bottom-20 left-4 right-4 z-40 mx-auto flex max-w-2xl items-center justify-between rounded-2xl bg-zinc-950 px-5 py-3.5 text-white shadow-2xl shadow-zinc-950/25 transition hover:-translate-y-0.5 dark:bg-white dark:text-zinc-950 sm:bottom-6"><span className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-orange-500 text-white"><ShoppingBag size={18} /></span><span className="font-bold">Открыть корзину <span className="text-zinc-400">· {count} шт.</span></span></span><span className="font-extrabold">{new Intl.NumberFormat("ru-RU").format(total)} ₽</span></button>;
}

export function MenuHome({ categories, items, isDemo }: { categories: Category[]; items: MenuItem[]; isDemo: boolean }) {
  const { count: cartCount } = useCart();
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchIsOpen, setSearchIsOpen] = useState(false);
  const [cartIsOpen, setCartIsOpen] = useState(false);
  const [ordersAreOpen, setOrdersAreOpen] = useState(false);
  const isOpen = getOpenStatus();
  const whatsAppLink = makeWhatsAppLink("Здравствуйте! Хочу уточнить информацию по меню B-Bay.");

  const filteredItems = useMemo(() => items.filter((item) => activeCategory === "all" || item.category_id === activeCategory), [items, activeCategory]);
  const showHighlights = activeCategory === "all";
  const popular = items.filter((item) => item.is_available && item.is_popular).slice(0, 4);
  const newItems = items.filter((item) => item.is_available && item.is_new).slice(0, 4);

  return <main className="min-h-dvh bg-[#f7f7f6] pb-36 text-zinc-900 transition-colors dark:bg-zinc-950 dark:text-zinc-100"><div className="mx-auto max-w-6xl px-4 pb-7 pt-4 sm:px-6 sm:pt-6">
    <header className="relative rounded-[2rem] bg-zinc-950 px-5 pb-5 pt-5 text-white shadow-xl shadow-zinc-950/10 sm:px-7 sm:pb-7">
      <div className="absolute right-5 top-5 sm:right-7"><ThemeToggle compact /></div>
      <div className="flex items-center gap-3 pr-20"><div className="grid size-12 place-items-center rounded-2xl bg-orange-500 text-lg font-black italic shadow-lg shadow-orange-500/30">B</div><div><p className="text-lg font-extrabold tracking-tight">B-Bay <span className="font-medium text-zinc-400">«Бабай»</span></p><p className="mt-0.5 text-xs text-zinc-400">Вкус, к которому хочется вернуться</p></div></div>
      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-zinc-300"><span className={`rounded-full px-3 py-1.5 text-xs font-bold ${isOpen ? "bg-emerald-400/15 text-emerald-300" : "bg-red-400/15 text-red-300"}`}><span className={`mr-1.5 inline-block size-1.5 rounded-full ${isOpen ? "bg-emerald-400" : "bg-red-400"}`} />{isOpen ? "Открыто" : "Закрыто"}</span><p className="flex items-center gap-2"><Clock3 size={16} className="text-orange-400" />Ежедневно, 10:00–23:00</p><p className="flex items-center gap-2"><MapPin size={16} className="text-orange-400" />Грозный, центр города</p></div>
      <a href={whatsAppLink ?? undefined} target="_blank" rel="noreferrer" aria-disabled={!whatsAppLink} className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-zinc-950 transition hover:bg-orange-50 aria-disabled:pointer-events-none aria-disabled:opacity-50"><MessageCircle size={17} className="text-emerald-600" />Связаться в WhatsApp</a>
    </header>

    {isDemo ? <div className="mt-4 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm leading-5 text-orange-900"><strong>Временно показано демонстрационное меню.</strong> За наличие и цены уточните у кафе.</div> : null}
    <div className="mt-5 grid grid-cols-[1fr_auto] gap-2">
      <button type="button" onClick={() => setSearchIsOpen(true)} className="flex h-13 min-w-0 items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-4 text-left text-zinc-500 shadow-sm transition hover:border-orange-300 hover:text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:text-white"><Search className="size-5 shrink-0" /><span className="truncate">Найти блюдо, состав или категорию</span></button>
      <button type="button" aria-label="Мои заказы" onClick={() => setOrdersAreOpen(true)} className="inline-flex h-13 items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-bold text-zinc-700 shadow-sm transition hover:border-orange-300 hover:text-orange-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"><ClipboardList size={19} /><span className="hidden sm:inline">Мои заказы</span></button>
    </div>
  </div>

  <nav aria-label="Категории меню" className="sticky top-0 z-30 border-y border-zinc-200/80 bg-[#f7f7f6]/95 py-3 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95"><div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 [scrollbar-width:none] sm:px-6"><button onClick={() => setActiveCategory("all")} className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition ${activeCategory === "all" ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950" : "bg-white text-zinc-600 ring-1 ring-zinc-200 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-300 dark:ring-zinc-700 dark:hover:bg-zinc-800"}`}>Все</button>{categories.filter((category) => category.is_active).map((category) => <button key={category.id} onClick={() => setActiveCategory(category.id)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition ${activeCategory === category.id ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950" : "bg-white text-zinc-600 ring-1 ring-zinc-200 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-300 dark:ring-zinc-700 dark:hover:bg-zinc-800"}`}>{category.name}</button>)}</div></nav>

  <div className="mx-auto max-w-6xl px-4 pt-7 sm:px-6">
    {showHighlights && popular.length ? <section data-section="popular"><SectionHeading icon={<Star size={15} fill="currentColor" />} title="Популярное" /><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{popular.map((item) => <DishCard key={item.id} item={item} onOpen={setSelectedItem} />)}</div></section> : null}
    {showHighlights && newItems.length ? <section data-section="new" className="mt-9"><SectionHeading icon={<Sparkles size={16} />} title="Новинки" /><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{newItems.map((item) => <DishCard key={item.id} item={item} onOpen={setSelectedItem} />)}</div></section> : null}
    <section data-section="menu" className={showHighlights ? "mt-9" : ""}><SectionHeading icon={<UtensilsCrossed size={16} />} eyebrow="Каталог" title={activeCategory === "all" ? "Всё меню" : categories.find((category) => category.id === activeCategory)?.name ?? "Меню"} subtitle={<span className="flex items-center gap-2"><span>{filteredItems.length} поз.</span><span role="group" aria-label="Режим отображения блюд" className="inline-flex rounded-xl bg-white p-1 shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-900 dark:ring-white/10"><button type="button" aria-label="Плитка" aria-pressed={viewMode === "grid"} onClick={() => setViewMode("grid")} className={`grid size-10 place-items-center rounded-lg transition ${viewMode === "grid" ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950" : "text-zinc-400 hover:text-orange-600"}`}><LayoutGrid size={16} /></button><button type="button" aria-label="Лента" aria-pressed={viewMode === "list"} onClick={() => setViewMode("list")} className={`grid size-10 place-items-center rounded-lg transition ${viewMode === "list" ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950" : "text-zinc-400 hover:text-orange-600"}`}><List size={17} /></button></span></span>} />
      {filteredItems.length ? <div className={viewMode === "grid" ? "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" : "grid gap-3 sm:grid-cols-2"}>{filteredItems.map((item) => <DishCard key={item.id} item={item} viewMode={viewMode} onOpen={setSelectedItem} />)}</div> : <div className="rounded-3xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center dark:border-zinc-700 dark:bg-zinc-900"><p className="font-bold text-zinc-950 dark:text-white">В этой категории пока нет блюд</p><p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Выберите другую категорию.</p></div>}
    </section>
  </div>
  <CartButton onOpen={() => setCartIsOpen(true)} />
  <nav aria-label="Основная навигация" className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/95 sm:hidden"><div className="mx-auto flex max-w-md items-center justify-around px-4 py-2"><Link href="/" className="flex min-h-11 min-w-16 flex-col items-center justify-center gap-1 text-xs font-bold text-orange-600"><UtensilsCrossed size={20} />Меню</Link><button type="button" onClick={() => setCartIsOpen(true)} className="relative flex min-h-11 min-w-16 flex-col items-center justify-center gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400"><ShoppingBag size={20} />Корзина{cartCount ? <span className="absolute right-1 top-0 grid min-h-5 min-w-5 place-items-center rounded-full bg-orange-500 px-1 text-[10px] font-bold text-white">{cartCount}</span> : null}</button><a href={whatsAppLink ?? undefined} target="_blank" rel="noreferrer" className="flex min-h-11 min-w-16 flex-col items-center justify-center gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400"><MessageCircle size={20} />Связь</a></div></nav>
  {selectedItem ? <DishDetailsDialog item={selectedItem} onClose={() => setSelectedItem(null)} /> : null}
  <MenuSearchDialog open={searchIsOpen} categories={categories} items={items} onClose={() => setSearchIsOpen(false)} onOpenItem={setSelectedItem} onOpenCart={() => setCartIsOpen(true)} />
  <CartDrawer open={cartIsOpen} onClose={() => setCartIsOpen(false)} />
  {ordersAreOpen ? <OrderHistoryDialog onClose={() => setOrdersAreOpen(false)} /> : null}
  </main>;
}
