"use client";

import { LoaderCircle, LogOut, Pencil, Plus, Save, Trash2, Upload } from "lucide-react";
import { useRef, useState, type FormEvent, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";
import { Button } from "@/components/ui/button";
import { slugify } from "@/lib/format";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { categorySchema, menuItemSchema } from "@/lib/validation/checkout";
import type { Category, MenuItem } from "@/types/menu";

type CategoryForm = Pick<Category, "name" | "slug" | "sort_order" | "is_active">;
type ItemForm = Omit<MenuItem, "id" | "created_at" | "updated_at" | "options">;

const emptyCategory: CategoryForm = { name: "", slug: "", sort_order: 0, is_active: true };
const emptyItem: ItemForm = { category_id: null, name: "", slug: "", description: null, composition: null, price: 0, weight: null, image_url: null, is_available: true, is_popular: false, is_new: false, sort_order: 0 };

export function AdminDashboard({ initialCategories, initialItems, email }: { initialCategories: Category[]; initialItems: MenuItem[]; email: string }) {
  const [categories, setCategories] = useState(initialCategories);
  const [items, setItems] = useState(initialItems);
  const [categoryForm, setCategoryForm] = useState<CategoryForm>(emptyCategory);
  const [itemForm, setItemForm] = useState<ItemForm>(emptyItem);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState<string>("");
  const [error, setError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function reportError(message: string) { setError(message); setNotice(""); }
  function reportSuccess(message: string) { setNotice(message); setError(""); }
  function resetCategory() { setCategoryForm(emptyCategory); setEditingCategory(null); }
  function resetItem() { setItemForm(emptyItem); setEditingItem(null); if (fileInputRef.current) fileInputRef.current.value = ""; }

  async function saveCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = categorySchema.safeParse(categoryForm);
    if (!result.success) return reportError(result.error.issues[0]?.message ?? "Проверьте категорию");
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return reportError("Supabase не настроен.");
    setSaving(true); setError("");
    const query = editingCategory
      ? supabase.from("categories").update(result.data).eq("id", editingCategory).select().single()
      : supabase.from("categories").insert(result.data).select().single();
    const { data, error: mutationError } = await query;
    setSaving(false);
    if (mutationError || !data) return reportError(mutationError?.message ?? "Не удалось сохранить категорию");
    const category = data as Category;
    setCategories((current) => (editingCategory ? current.map((item) => item.id === category.id ? category : item) : [...current, category]).sort(byOrder));
    reportSuccess(editingCategory ? "Категория обновлена" : "Категория добавлена"); resetCategory();
  }

  async function deleteCategory(category: Category) {
    if (!window.confirm(`Удалить категорию «${category.name}»? Блюда останутся без категории.`)) return;
    const supabase = getSupabaseBrowserClient(); if (!supabase) return reportError("Supabase не настроен.");
    const { error: mutationError } = await supabase.from("categories").delete().eq("id", category.id);
    if (mutationError) return reportError(mutationError.message);
    setCategories((current) => current.filter((item) => item.id !== category.id));
    setItems((current) => current.map((item) => item.category_id === category.id ? { ...item, category_id: null } : item));
    if (editingCategory === category.id) resetCategory();
    reportSuccess("Категория удалена");
  }

  async function uploadImage(file: File) {
    if (!file.type.startsWith("image/")) return reportError("Можно загрузить только изображение.");
    if (file.size > 5 * 1024 * 1024) return reportError("Файл должен быть не больше 5 МБ.");
    const supabase = getSupabaseBrowserClient(); if (!supabase) return reportError("Supabase не настроен.");
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `menu/${crypto.randomUUID()}.${extension}`;
    setUploading(true); setError("");
    const { error: uploadError } = await supabase.storage.from("menu-images").upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });
    setUploading(false);
    if (uploadError) return reportError(uploadError.message);
    const { data } = supabase.storage.from("menu-images").getPublicUrl(path);
    setItemForm((current) => ({ ...current, image_url: data.publicUrl }));
    reportSuccess("Фотография загружена");
  }

  async function saveItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const sanitized: ItemForm = { ...itemForm, category_id: itemForm.category_id || null, description: itemForm.description?.trim() || null, composition: itemForm.composition?.trim() || null, weight: itemForm.weight?.trim() || null, image_url: itemForm.image_url?.trim() || null };
    const result = menuItemSchema.safeParse(sanitized);
    if (!result.success) return reportError(result.error.issues[0]?.message ?? "Проверьте блюдо");
    const supabase = getSupabaseBrowserClient(); if (!supabase) return reportError("Supabase не настроен.");
    setSaving(true); setError("");
    const query = editingItem
      ? supabase.from("menu_items").update(result.data).eq("id", editingItem).select().single()
      : supabase.from("menu_items").insert(result.data).select().single();
    const { data, error: mutationError } = await query;
    setSaving(false);
    if (mutationError || !data) return reportError(mutationError?.message ?? "Не удалось сохранить блюдо");
    const item = data as MenuItem;
    setItems((current) => (editingItem ? current.map((currentItem) => currentItem.id === item.id ? item : currentItem) : [...current, item]).sort(byOrder));
    reportSuccess(editingItem ? "Блюдо обновлено" : "Блюдо добавлено"); resetItem();
  }

  async function deleteItem(item: MenuItem) {
    if (!window.confirm(`Удалить блюдо «${item.name}»?`)) return;
    const supabase = getSupabaseBrowserClient(); if (!supabase) return reportError("Supabase не настроен.");
    const { error: mutationError } = await supabase.from("menu_items").delete().eq("id", item.id);
    if (mutationError) return reportError(mutationError.message);
    setItems((current) => current.filter((currentItem) => currentItem.id !== item.id));
    if (editingItem === item.id) resetItem();
    reportSuccess("Блюдо удалено");
  }

  async function signOut() {
    await getSupabaseBrowserClient()?.auth.signOut();
    window.location.assign("/login");
  }

  return <main className="min-h-dvh bg-[#f7f7f6] pb-12"><header className="border-b border-zinc-200 bg-white"><div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6"><div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-xl bg-orange-500 font-black italic text-white">B</div><div><p className="font-extrabold text-zinc-950">B-Bay · Админ</p><p className="text-xs text-zinc-500">{email}</p></div></div><button type="button" onClick={signOut} className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-zinc-600 transition hover:bg-zinc-100"><LogOut size={17} />Выйти</button></div></header>
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6"><div className="mb-6"><h1 className="text-3xl font-extrabold tracking-tight text-zinc-950">Управление меню</h1><p className="mt-1 text-sm text-zinc-500">Категории, блюда, фотографии и порядок отображения.</p></div>{notice ? <p role="status" className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">{notice}</p> : null}{error ? <p role="alert" className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p> : null}
      <div className="grid gap-6 lg:grid-cols-[.85fr_1.45fr]"><section className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-zinc-950/5 sm:p-5"><div className="flex items-center justify-between"><h2 className="font-bold text-zinc-950">Категории</h2><span className="text-sm text-zinc-400">{categories.length}</span></div><form onSubmit={saveCategory} className="mt-4 space-y-3"><AdminInput label="Название" value={categoryForm.name} onChange={(value) => setCategoryForm((current) => ({ ...current, name: value, slug: current.slug || slugify(value) }))} required /><AdminInput label="URL-ярлык" value={categoryForm.slug} onChange={(value) => setCategoryForm((current) => ({ ...current, slug: value }))} required /><AdminInput label="Порядок" type="number" value={String(categoryForm.sort_order)} onChange={(value) => setCategoryForm((current) => ({ ...current, sort_order: Number(value) || 0 }))} /><Check label="Показывать категорию" checked={categoryForm.is_active} onChange={(checked) => setCategoryForm((current) => ({ ...current, is_active: checked }))} /><div className="flex gap-2"><Button type="submit" size="sm" disabled={saving} className="flex-1">{saving ? <LoaderCircle className="animate-spin" size={16} /> : <Save size={16} />}{editingCategory ? "Сохранить" : "Добавить"}</Button>{editingCategory ? <Button type="button" size="sm" variant="secondary" onClick={resetCategory}>Отмена</Button> : null}</div></form><div className="mt-5 space-y-2 border-t border-zinc-100 pt-4">{categories.length ? categories.map((category) => <div key={category.id} className="flex items-center justify-between gap-2 rounded-xl bg-zinc-50 px-3 py-2.5"><div className="min-w-0"><p className="truncate text-sm font-bold text-zinc-800">{category.name} {!category.is_active ? <span className="text-zinc-400">· скрыта</span> : null}</p><p className="text-xs text-zinc-400">#{category.sort_order} · {category.slug}</p></div><div className="flex"><IconButton label={`Редактировать ${category.name}`} onClick={() => { setEditingCategory(category.id); setCategoryForm({ name: category.name, slug: category.slug, sort_order: category.sort_order, is_active: category.is_active }); }}><Pencil size={15} /></IconButton><IconButton label={`Удалить ${category.name}`} danger onClick={() => deleteCategory(category)}><Trash2 size={15} /></IconButton></div></div>) : <p className="py-4 text-center text-sm text-zinc-500">Категорий пока нет.</p>}</div></section>

      <section className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-zinc-950/5 sm:p-5"><div className="flex items-center justify-between"><h2 className="font-bold text-zinc-950">{editingItem ? "Редактирование блюда" : "Новое блюдо"}</h2>{editingItem ? <button type="button" onClick={resetItem} className="text-sm font-bold text-orange-600">Отменить</button> : null}</div><form onSubmit={saveItem} className="mt-4 grid gap-3 sm:grid-cols-2"><AdminInput label="Название" value={itemForm.name} onChange={(value) => setItemForm((current) => ({ ...current, name: value, slug: current.slug || slugify(value) }))} required /><AdminInput label="URL-ярлык" value={itemForm.slug} onChange={(value) => setItemForm((current) => ({ ...current, slug: value }))} required /><label className="block text-sm font-semibold text-zinc-700">Категория<select value={itemForm.category_id ?? ""} onChange={(event) => setItemForm((current) => ({ ...current, category_id: event.target.value || null }))} className={selectClass}><option value="">Без категории</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><AdminInput label="Цена, ₽" type="number" min="0" value={String(itemForm.price)} onChange={(value) => setItemForm((current) => ({ ...current, price: Number(value) || 0 }))} required /><AdminInput label="Вес / объём" value={itemForm.weight ?? ""} onChange={(value) => setItemForm((current) => ({ ...current, weight: value }))} placeholder="280 г" /><AdminInput label="Порядок" type="number" min="0" value={String(itemForm.sort_order)} onChange={(value) => setItemForm((current) => ({ ...current, sort_order: Number(value) || 0 }))} /><AdminTextArea className="sm:col-span-2" label="Краткое описание" value={itemForm.description ?? ""} onChange={(value) => setItemForm((current) => ({ ...current, description: value }))} rows={2} /><AdminTextArea className="sm:col-span-2" label="Состав" value={itemForm.composition ?? ""} onChange={(value) => setItemForm((current) => ({ ...current, composition: value }))} rows={3} /><div className="sm:col-span-2"><AdminInput label="Ссылка на фото" value={itemForm.image_url ?? ""} onChange={(value) => setItemForm((current) => ({ ...current, image_url: value }))} placeholder="https://..." /><div className="mt-2 flex flex-wrap items-center gap-2"><input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadImage(file); }} /><Button type="button" size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={uploading}>{uploading ? <LoaderCircle className="animate-spin" size={16} /> : <Upload size={16} />}{uploading ? "Загрузка…" : "Загрузить фото"}</Button><span className="text-xs text-zinc-400">JPG, PNG или WebP до 5 МБ</span></div></div><div className="sm:col-span-2 flex flex-wrap gap-x-5 gap-y-2"><Check label="Доступно" checked={itemForm.is_available} onChange={(checked) => setItemForm((current) => ({ ...current, is_available: checked }))} /><Check label="Популярное" checked={itemForm.is_popular} onChange={(checked) => setItemForm((current) => ({ ...current, is_popular: checked }))} /><Check label="Новинка" checked={itemForm.is_new} onChange={(checked) => setItemForm((current) => ({ ...current, is_new: checked }))} /></div><Button type="submit" disabled={saving || uploading} className="sm:col-span-2">{saving ? <LoaderCircle className="animate-spin" size={17} /> : editingItem ? <Save size={17} /> : <Plus size={17} />}{editingItem ? "Сохранить изменения" : "Добавить блюдо"}</Button></form></section></div>
      <section className="mt-6 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-zinc-950/5 sm:p-5"><div className="flex items-center justify-between"><h2 className="font-bold text-zinc-950">Блюда</h2><span className="text-sm text-zinc-400">{items.length}</span></div><div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{items.length ? items.map((item) => <article key={item.id} className="rounded-2xl border border-zinc-100 p-3"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><h3 className="truncate font-bold text-zinc-900">{item.name}</h3><p className="mt-0.5 text-sm font-semibold text-orange-600">{new Intl.NumberFormat("ru-RU").format(item.price)} ₽</p></div><div className="flex"><IconButton label={`Редактировать ${item.name}`} onClick={() => { setEditingItem(item.id); setItemForm({ category_id: item.category_id, name: item.name, slug: item.slug, description: item.description, composition: item.composition, price: item.price, weight: item.weight, image_url: item.image_url, is_available: item.is_available, is_popular: item.is_popular, is_new: item.is_new, sort_order: item.sort_order }); window.scrollTo({ top: 0, behavior: "smooth" }); }}><Pencil size={15} /></IconButton><IconButton label={`Удалить ${item.name}`} danger onClick={() => deleteItem(item)}><Trash2 size={15} /></IconButton></div></div><p className="mt-2 text-xs text-zinc-500">{categories.find((category) => category.id === item.category_id)?.name ?? "Без категории"} · #{item.sort_order}</p><div className="mt-2 flex flex-wrap gap-1.5">{!item.is_available ? <Tag>Скрыто</Tag> : null}{item.is_popular ? <Tag>Популярное</Tag> : null}{item.is_new ? <Tag>Новинка</Tag> : null}</div></article>) : <p className="py-8 text-center text-sm text-zinc-500">Добавьте первое блюдо в меню.</p>}</div></section>
    </div></main>;
}

const selectClass = "mt-1.5 h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100";
function byOrder<T extends { sort_order: number; name: string }>(a: T, b: T) { return a.sort_order - b.sort_order || a.name.localeCompare(b.name, "ru"); }
function AdminInput({ label, value, onChange, className = "", ...props }: { label: string; value: string; onChange: (value: string) => void; className?: string } & Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) { return <label className={`block text-sm font-semibold text-zinc-700 ${className}`}>{label}<input value={value} onChange={(event) => onChange(event.target.value)} className="mt-1.5 h-10 w-full rounded-xl border border-zinc-200 px-3 text-sm font-normal outline-none transition placeholder:text-zinc-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100" {...props} /></label>; }
function AdminTextArea({ label, value, onChange, className = "", ...props }: { label: string; value: string; onChange: (value: string) => void; className?: string } & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "onChange">) { return <label className={`block text-sm font-semibold text-zinc-700 ${className}`}>{label}<textarea value={value} onChange={(event) => onChange(event.target.value)} className="mt-1.5 w-full resize-none rounded-xl border border-zinc-200 px-3 py-2.5 text-sm font-normal outline-none transition placeholder:text-zinc-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100" {...props} /></label>; }
function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) { return <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-zinc-700"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="size-4 accent-orange-500" />{label}</label>; }
function IconButton({ label, onClick, danger, children }: { label: string; onClick: () => void; danger?: boolean; children: ReactNode }) { return <button type="button" aria-label={label} onClick={onClick} className={`grid size-8 place-items-center rounded-lg transition ${danger ? "text-zinc-400 hover:bg-red-50 hover:text-red-600" : "text-zinc-400 hover:bg-orange-50 hover:text-orange-600"}`}>{children}</button>; }
function Tag({ children }: { children: ReactNode }) { return <span className="rounded-full bg-zinc-100 px-2 py-1 text-[11px] font-bold text-zinc-500">{children}</span>; }
