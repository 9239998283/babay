"use client";

import { LoaderCircle, Pencil, Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import type { DeliveryZone, PromoCode, RestaurantSettings } from "@/types/restaurant";

const dayLabels: Record<string, string> = { "1": "Пн", "2": "Вт", "3": "Ср", "4": "Чт", "5": "Пт", "6": "Сб", "7": "Вс" };

const emptyZone: Omit<DeliveryZone, "id"> = { name: "", description: "", fee: 0, minimum_order: 0, is_active: true, sort_order: 0 };
const emptyPromo: PromoCode = { code: "", discount_type: "percent", discount_value: 10, minimum_order: 0, maximum_discount: null, starts_at: null, ends_at: null, usage_limit: null, usage_count: 0, is_active: true };

export function AdminSettings({ initialSettings, initialZones, initialPromos }: { initialSettings: RestaurantSettings; initialZones: DeliveryZone[]; initialPromos: PromoCode[] }) {
  const [settings, setSettings] = useState(initialSettings);
  const [zones, setZones] = useState(initialZones);
  const [promos, setPromos] = useState(initialPromos);
  const [zoneForm, setZoneForm] = useState<Omit<DeliveryZone, "id"> & { id?: string }>(emptyZone);
  const [promoForm, setPromoForm] = useState<PromoCode>(emptyPromo);
  const [saving, setSaving] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (dirty) event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function updateSettings(patch: Partial<RestaurantSettings>) {
    setSettings((current) => ({ ...current, ...patch }));
    setDirty(true);
  }

  async function saveSettings(event: FormEvent) {
    event.preventDefault();
    setSaving("settings"); setError(""); setNotice("");
    try {
      const { id: _id, updated_at: _updatedAt, ...payload } = settings;
      void _id; void _updatedAt;
      const response = await fetch("/api/admin/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await response.json() as { settings?: RestaurantSettings; error?: string };
      if (!response.ok || !data.settings) return setError(data.error ?? "Не удалось сохранить настройки.");
      setSettings(data.settings); setDirty(false); setNotice("Настройки сохранены и уже управляют клиентским меню.");
    } catch { setError("Нет связи с сервером."); } finally { setSaving(""); }
  }

  async function saveZone(event: FormEvent) {
    event.preventDefault(); setSaving("zone"); setError("");
    try {
      const response = await fetch("/api/admin/delivery-zones", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "save", zone: zoneForm }) });
      const data = await response.json() as { zone?: DeliveryZone; error?: string };
      if (!response.ok || !data.zone) return setError(data.error ?? "Не удалось сохранить зону.");
      setZones((current) => [...current.filter((zone) => zone.id !== data.zone?.id), data.zone as DeliveryZone].sort((a, b) => a.sort_order - b.sort_order));
      setZoneForm(emptyZone); setNotice("Зона доставки сохранена.");
    } catch { setError("Нет связи с сервером."); } finally { setSaving(""); }
  }

  async function deleteZone(zone: DeliveryZone) {
    if (!window.confirm(`Удалить зону «${zone.name}»? В старых заказах останется её название и стоимость.`)) return;
    setSaving(`zone-${zone.id}`);
    const response = await fetch("/api/admin/delivery-zones", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "delete", id: zone.id, confirmed: true }) });
    if (response.ok) { setZones((current) => current.filter((item) => item.id !== zone.id)); setNotice("Зона удалена."); } else setError("Не удалось удалить зону.");
    setSaving("");
  }

  async function savePromo(event: FormEvent) {
    event.preventDefault(); setSaving("promo"); setError("");
    const payload = { ...promoForm, code: promoForm.code.toUpperCase(), usage_count: undefined };
    delete (payload as { usage_count?: number }).usage_count;
    try {
      const response = await fetch("/api/admin/promo-codes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "save", promo: payload }) });
      const data = await response.json() as { promo?: PromoCode; error?: string };
      if (!response.ok || !data.promo) return setError(data.error ?? "Не удалось сохранить промокод.");
      setPromos((current) => [...current.filter((promo) => promo.code !== data.promo?.code), data.promo as PromoCode]);
      setPromoForm(emptyPromo); setNotice("Промокод сохранён.");
    } catch { setError("Нет связи с сервером."); } finally { setSaving(""); }
  }

  async function deletePromo(promo: PromoCode) {
    if (!window.confirm(`Удалить промокод ${promo.code}?`)) return;
    const response = await fetch("/api/admin/promo-codes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "delete", code: promo.code, confirmed: true }) });
    if (response.ok) { setPromos((current) => current.filter((item) => item.code !== promo.code)); setNotice("Промокод удалён."); } else setError("Не удалось удалить промокод.");
  }

  return <section aria-labelledby="settings-title">
    <div><h2 id="settings-title" className="text-2xl font-extrabold tracking-tight text-zinc-950">Операционные настройки</h2><p className="mt-1 text-sm text-zinc-500">Эти данные отображаются клиентам и участвуют в серверном расчёте заказа.</p></div>
    {notice ? <p role="status" className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</p> : null}{error ? <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

    <form onSubmit={saveSettings} className="mt-5 space-y-5 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-zinc-950/5 sm:p-5">
      <label className="flex min-h-14 items-center justify-between gap-4 rounded-2xl bg-zinc-950 px-4 py-3 text-white"><span><strong className="block">Приём заказов</strong><span className="text-xs text-zinc-400">Ручной переключатель важнее расписания</span></span><input type="checkbox" checked={settings.orders_open} onChange={(event) => updateSettings({ orders_open: event.target.checked })} className="size-6 accent-orange-500" aria-label="Приём заказов открыт" /></label>
      <div className="grid gap-4 sm:grid-cols-2"><SettingInput label="Название заведения" value={settings.establishment_name} onChange={(value) => updateSettings({ establishment_name: value })} /><SettingInput label="Адрес" value={settings.address} onChange={(value) => updateSettings({ address: value })} /><SettingInput label="Телефон" value={settings.phone} onChange={(value) => updateSettings({ phone: value })} /><SettingInput label="WhatsApp, только цифры" value={settings.whatsapp_phone} onChange={(value) => updateSettings({ whatsapp_phone: value.replace(/\D/g, "") })} /></div>
      <fieldset><legend className="text-sm font-bold text-zinc-800">Часы работы</legend><div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{Object.entries(dayLabels).map(([day, label]) => { const schedule = settings.opening_hours[day] ?? { enabled: false, open: "10:00", close: "23:00" }; return <div key={day} className="rounded-2xl border border-zinc-200 p-3"><label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={schedule.enabled} onChange={(event) => updateSettings({ opening_hours: { ...settings.opening_hours, [day]: { ...schedule, enabled: event.target.checked } } })} className="size-4 accent-orange-500" />{label}</label><div className="mt-2 grid grid-cols-2 gap-2"><input aria-label={`Открытие ${label}`} type="time" value={schedule.open} onChange={(event) => updateSettings({ opening_hours: { ...settings.opening_hours, [day]: { ...schedule, open: event.target.value } } })} className="min-w-0 rounded-lg border border-zinc-200 px-2 py-2 text-xs" /><input aria-label={`Закрытие ${label}`} type="time" value={schedule.close} onChange={(event) => updateSettings({ opening_hours: { ...settings.opening_hours, [day]: { ...schedule, close: event.target.value } } })} className="min-w-0 rounded-lg border border-zinc-200 px-2 py-2 text-xs" /></div></div>; })}</div></fieldset>
      <div className="grid gap-4 sm:grid-cols-3"><NumberInput label="Минимальный заказ, ₽" value={settings.minimum_order} onChange={(value) => updateSettings({ minimum_order: value })} /><NumberInput label="Приготовление, мин" value={settings.preparation_minutes} min={1} onChange={(value) => updateSettings({ preparation_minutes: value })} /><NumberInput label="Доставка, мин" value={settings.delivery_minutes} min={1} onChange={(value) => updateSettings({ delivery_minutes: value })} /></div>
      <fieldset><legend className="text-sm font-bold text-zinc-800">Способы оплаты</legend><div className="mt-2 flex flex-wrap gap-4">{[["cash", "Наличными"], ["transfer", "Переводом"]].map(([value, label]) => <label key={value} className="flex min-h-11 items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={settings.payment_methods.includes(value)} onChange={(event) => updateSettings({ payment_methods: event.target.checked ? [...settings.payment_methods, value] : settings.payment_methods.filter((item) => item !== value) })} className="size-4 accent-orange-500" />{label}</label>)}</div></fieldset>
      <Button type="submit" disabled={saving === "settings" || !dirty}>{saving === "settings" ? <LoaderCircle className="animate-spin" size={17} /> : <Save size={17} />}Сохранить настройки</Button>
    </form>

    <div className="mt-6 grid gap-6 lg:grid-cols-2">
      <section className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-zinc-950/5 sm:p-5"><h3 className="text-lg font-bold">Зоны доставки</h3><form onSubmit={saveZone} className="mt-4 grid gap-3 sm:grid-cols-2"><SettingInput label="Название" value={zoneForm.name} onChange={(value) => setZoneForm((current) => ({ ...current, name: value }))} /><NumberInput label="Стоимость, ₽" value={zoneForm.fee} onChange={(value) => setZoneForm((current) => ({ ...current, fee: value }))} /><NumberInput label="Минимальный заказ, ₽" value={zoneForm.minimum_order} onChange={(value) => setZoneForm((current) => ({ ...current, minimum_order: value }))} /><label className="flex min-h-11 items-center gap-2 self-end text-sm font-semibold"><input type="checkbox" checked={zoneForm.is_active} onChange={(event) => setZoneForm((current) => ({ ...current, is_active: event.target.checked }))} className="size-4 accent-orange-500" />Активна</label><Button type="submit" size="sm" disabled={saving === "zone"} className="sm:col-span-2">{zoneForm.id ? <Save size={16} /> : <Plus size={16} />}{zoneForm.id ? "Сохранить зону" : "Добавить зону"}</Button></form><div className="mt-4 space-y-2">{zones.map((zone) => <div key={zone.id} className="flex items-center justify-between gap-3 rounded-xl bg-zinc-50 px-3 py-2"><p className="min-w-0 text-sm"><strong>{zone.name}</strong><br /><span className="text-xs text-zinc-500">{zone.fee ? `${zone.fee} ₽` : "Бесплатно"} · мин. {zone.minimum_order} ₽</span></p><div className="flex"><IconButton label="Редактировать зону" onClick={() => setZoneForm(zone)}><Pencil size={15} /></IconButton><IconButton label="Удалить зону" danger onClick={() => void deleteZone(zone)}><Trash2 size={15} /></IconButton></div></div>)}</div></section>

      <section className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-zinc-950/5 sm:p-5"><h3 className="text-lg font-bold">Промокоды</h3><form onSubmit={savePromo} className="mt-4 grid gap-3 sm:grid-cols-2"><SettingInput label="Код" value={promoForm.code} onChange={(value) => setPromoForm((current) => ({ ...current, code: value.toUpperCase() }))} /><label className="text-sm font-semibold">Тип<select value={promoForm.discount_type} onChange={(event) => setPromoForm((current) => ({ ...current, discount_type: event.target.value as PromoCode["discount_type"] }))} className="mt-1.5 h-11 w-full rounded-xl border border-zinc-200 bg-white px-3"><option value="percent">Процент</option><option value="fixed">Фиксированная сумма</option></select></label><NumberInput label={promoForm.discount_type === "percent" ? "Скидка, %" : "Скидка, ₽"} value={promoForm.discount_value} min={1} onChange={(value) => setPromoForm((current) => ({ ...current, discount_value: value }))} /><NumberInput label="Минимальный заказ, ₽" value={promoForm.minimum_order} onChange={(value) => setPromoForm((current) => ({ ...current, minimum_order: value }))} /><label className="flex min-h-11 items-center gap-2 text-sm font-semibold sm:col-span-2"><input type="checkbox" checked={promoForm.is_active} onChange={(event) => setPromoForm((current) => ({ ...current, is_active: event.target.checked }))} className="size-4 accent-orange-500" />Активен</label><Button type="submit" size="sm" className="sm:col-span-2" disabled={saving === "promo"}><Plus size={16} />Сохранить промокод</Button></form><div className="mt-4 space-y-2">{promos.map((promo) => <div key={promo.code} className="flex items-center justify-between gap-3 rounded-xl bg-zinc-50 px-3 py-2"><p className="text-sm"><strong>{promo.code}</strong><br /><span className="text-xs text-zinc-500">{promo.discount_type === "percent" ? `${promo.discount_value}%` : `${promo.discount_value} ₽`} · использован {promo.usage_count}</span></p><IconButton label="Удалить промокод" danger onClick={() => void deletePromo(promo)}><Trash2 size={15} /></IconButton></div>)}</div></section>
    </div>
  </section>;
}

function SettingInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="block text-sm font-semibold text-zinc-700">{label}<input value={value} onChange={(event) => onChange(event.target.value)} required className="mt-1.5 h-11 w-full rounded-xl border border-zinc-200 px-3 text-sm font-normal outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" /></label>; }
function NumberInput({ label, value, min = 0, onChange }: { label: string; value: number; min?: number; onChange: (value: number) => void }) { return <label className="block text-sm font-semibold text-zinc-700">{label}<input type="number" min={min} value={value} onChange={(event) => onChange(Number(event.target.value) || 0)} required className="mt-1.5 h-11 w-full rounded-xl border border-zinc-200 px-3 text-sm font-normal outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" /></label>; }
function IconButton({ label, onClick, danger, children }: { label: string; onClick: () => void; danger?: boolean; children: React.ReactNode }) { return <button type="button" aria-label={label} onClick={onClick} className={`grid size-11 place-items-center rounded-lg ${danger ? "text-red-500 hover:bg-red-50" : "text-zinc-500 hover:bg-orange-50 hover:text-orange-600"}`}>{children}</button>; }

