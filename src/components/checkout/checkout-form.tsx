"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2, MessageCircle, PackageOpen } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatPrice } from "@/lib/format";
import { checkoutSchema, type CheckoutValues } from "@/lib/validation/checkout";
import { buildWhatsAppMessage, makeWhatsAppLink } from "@/lib/whatsapp";
import { useCart } from "@/store/cart-store";

type FieldErrors = Partial<Record<keyof CheckoutValues, string>>;

const initialValues: CheckoutValues = { name: "", phone: "", fulfillment: "delivery", address: "", comment: "" };

export function CheckoutForm() {
  const { lines, total, orderComment, clearCart } = useCart();
  const [values, setValues] = useState<CheckoutValues>(initialValues);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [linkWasOpened, setLinkWasOpened] = useState(false);
  const [generalError, setGeneralError] = useState("");

  function setField<K extends keyof CheckoutValues>(field: K, value: CheckoutValues[K]) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setGeneralError("");
    if (!lines.length) return setGeneralError("Корзина пуста. Добавьте блюда перед оформлением.");
    const result = checkoutSchema.safeParse(values);
    if (!result.success) {
      const fields = result.error.flatten().fieldErrors;
      setErrors(Object.fromEntries(Object.entries(fields).map(([key, messages]) => [key, messages?.[0]])) as FieldErrors);
      return;
    }
    const link = makeWhatsAppLink(buildWhatsAppMessage(lines, result.data, orderComment));
    if (!link) return setGeneralError("Не указан номер WhatsApp кафе. Добавьте NEXT_PUBLIC_WHATSAPP_PHONE в переменные окружения.");
    window.open(link, "_blank", "noopener,noreferrer");
    setLinkWasOpened(true);
  }

  if (!lines.length) return <main className="min-h-dvh bg-[#f7f7f6] px-4 py-6 sm:px-6"><div className="mx-auto max-w-xl"><Link href="/cart" className="inline-flex items-center gap-2 text-sm font-bold text-zinc-600"><ArrowLeft size={18} />К корзине</Link><div className="mt-8"><EmptyState icon={<PackageOpen size={23} />} title="Нечего оформлять" description="Добавьте блюда в корзину, затем вернитесь к оформлению." action={<Link href="/" className="inline-flex h-11 items-center justify-center rounded-xl bg-orange-500 px-4 text-sm font-bold text-white">Открыть меню</Link>} /></div></div></main>;

  return <main className="min-h-dvh bg-[#f7f7f6] pb-10"><div className="mx-auto max-w-xl px-4 py-5 sm:px-6 sm:py-8"><Link href="/cart" className="inline-flex items-center gap-2 text-sm font-bold text-zinc-600 transition hover:text-orange-600"><ArrowLeft size={18} />К корзине</Link><header className="mt-5"><p className="text-xs font-bold uppercase tracking-[0.14em] text-orange-600">Последний шаг</p><h1 className="mt-1 text-3xl font-extrabold tracking-tight text-zinc-950">Оформление заказа</h1><p className="mt-2 text-sm leading-6 text-zinc-500">Мы откроем WhatsApp с готовым заказом. Сотрудник кафе подтвердит его вручную.</p></header>
    <form onSubmit={submit} noValidate className="mt-6 space-y-4"><div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-zinc-950/5 sm:p-5"><h2 className="font-bold text-zinc-950">Контактные данные</h2><div className="mt-4 grid gap-4"><Field label="Ваше имя" error={errors.name}><input value={values.name} onChange={(event) => setField("name", event.target.value)} autoComplete="name" placeholder="Ахмед" /></Field><Field label="Номер телефона" error={errors.phone}><input value={values.phone} onChange={(event) => setField("phone", event.target.value)} autoComplete="tel" inputMode="tel" placeholder="+7 999 000-00-00" /></Field></div></div>
      <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-zinc-950/5 sm:p-5"><h2 className="font-bold text-zinc-950">Способ получения</h2><div className="mt-4 grid grid-cols-2 gap-2"><Choice checked={values.fulfillment === "delivery"} onClick={() => setField("fulfillment", "delivery")} label="Доставка" /><Choice checked={values.fulfillment === "pickup"} onClick={() => setField("fulfillment", "pickup")} label="Самовывоз" /></div>{values.fulfillment === "delivery" ? <Field label="Адрес доставки" error={errors.address} className="mt-4"><textarea value={values.address} onChange={(event) => setField("address", event.target.value)} rows={2} placeholder="Грозный, улица, дом, квартира" /></Field> : <p className="mt-4 rounded-xl bg-zinc-50 px-3.5 py-3 text-sm leading-5 text-zinc-600">Самовывоз: адрес и время готовности уточнит сотрудник кафе.</p>}</div>
      <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-zinc-950/5 sm:p-5"><Field label="Комментарий к заказу" error={errors.comment}><textarea value={values.comment} onChange={(event) => setField("comment", event.target.value)} rows={3} maxLength={500} placeholder="Например, не добавлять лук" /></Field></div>
      <section className="rounded-3xl bg-zinc-950 p-5 text-white"><p className="text-sm text-zinc-400">Итого к оплате</p><p className="mt-1 text-3xl font-extrabold">{formatPrice(total)}</p><Button type="submit" size="lg" className="mt-5 w-full"><MessageCircle size={19} />Оформить через WhatsApp</Button>{generalError ? <p role="alert" className="mt-3 rounded-xl bg-red-500/15 px-3 py-2 text-sm text-red-200">{generalError}</p> : null}</section>
    </form>
    {linkWasOpened ? <section className="mt-4 rounded-3xl border border-emerald-200 bg-emerald-50 p-4"><div className="flex gap-3"><CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={21} /><div><h2 className="font-bold text-emerald-950">WhatsApp открыт</h2><p className="mt-1 text-sm leading-5 text-emerald-800">Корзина сохранена — очистите её только после отправки сообщения.</p><button type="button" onClick={clearCart} className="mt-3 text-sm font-bold text-emerald-800 underline underline-offset-4">Заказ отправлен — очистить корзину</button></div></div></section> : null}
  </div></main>;
}

function Field({ label, error, className = "", children }: { label: string; error?: string; className?: string; children: ReactNode }) {
  return <label className={`block ${className}`}><span className="text-sm font-semibold text-zinc-800">{label}</span><div className="mt-2 [&_input]:h-11 [&_input]:w-full [&_input]:rounded-xl [&_input]:border [&_input]:border-zinc-200 [&_input]:px-3.5 [&_input]:text-sm [&_input]:outline-none [&_input]:transition [&_input:focus]:border-orange-400 [&_input:focus]:ring-2 [&_input:focus]:ring-orange-100 [&_textarea]:w-full [&_textarea]:resize-none [&_textarea]:rounded-xl [&_textarea]:border [&_textarea]:border-zinc-200 [&_textarea]:px-3.5 [&_textarea]:py-3 [&_textarea]:text-sm [&_textarea]:outline-none [&_textarea]:transition [&_textarea:focus]:border-orange-400 [&_textarea:focus]:ring-2 [&_textarea:focus]:ring-orange-100">{children}</div>{error ? <p role="alert" className="mt-1.5 text-xs font-medium text-red-600">{error}</p> : null}</label>;
}

function Choice({ checked, onClick, label }: { checked: boolean; onClick: () => void; label: string }) {
  return <button type="button" onClick={onClick} className={`h-11 rounded-xl border text-sm font-bold transition ${checked ? "border-orange-500 bg-orange-50 text-orange-700" : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"}`}>{label}</button>;
}
