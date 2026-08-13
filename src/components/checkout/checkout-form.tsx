"use client";

import Link from "next/link";
import { CheckCircle2, MessageCircle, PackageOpen } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatPrice } from "@/lib/format";
import { saveOrderSummary } from "@/lib/order-history";
import { checkoutSchema, type CheckoutValues } from "@/lib/validation/checkout";
import { buildWhatsAppMessage, makeWhatsAppLink } from "@/lib/whatsapp";
import { useCart } from "@/store/cart-store";

type FieldErrors = Partial<Record<keyof CheckoutValues, string>>;

const initialValues: CheckoutValues = {
  name: "",
  phone: "",
  fulfillment: "delivery",
  payment: "cash",
  address: "",
  promoCode: "",
};

export function CheckoutForm({ embedded = false }: { embedded?: boolean }) {
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
      setErrors(
        Object.fromEntries(Object.entries(fields).map(([key, messages]) => [key, messages?.[0]])) as FieldErrors,
      );
      return;
    }

    const link = makeWhatsAppLink(buildWhatsAppMessage(lines, result.data, orderComment));
    if (!link) {
      return setGeneralError("Не указан номер WhatsApp кафе. Обратитесь к администратору.");
    }

    window.open(link, "_blank", "noopener,noreferrer");
    saveOrderSummary(lines, result.data);
    setLinkWasOpened(true);
  }

  if (!lines.length) {
    if (embedded) return null;
    return (
      <main className="min-h-dvh bg-[#f7f7f6] px-4 py-6 transition-colors dark:bg-zinc-950 sm:px-6">
        <div className="mx-auto max-w-xl">
          <div className="mt-8">
            <EmptyState
              icon={<PackageOpen size={23} />}
              title="Нечего оформлять"
              description="Добавьте блюда в корзину, затем вернитесь к оформлению."
              action={<Link href="/" className="inline-flex h-11 items-center justify-center rounded-xl bg-orange-500 px-4 text-sm font-bold text-white">Открыть меню</Link>}
            />
          </div>
        </div>
      </main>
    );
  }

  const content = (
    <>
      <header className={embedded ? "mb-5" : "mt-5"}>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-orange-600">Последний шаг</p>
        {embedded ? (
          <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-zinc-950 dark:text-white">Оформление заказа</h2>
        ) : (
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-white">Оформление заказа</h1>
        )}
        <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
          Заполните данные — мы откроем WhatsApp с готовым заказом. Сотрудник кафе подтвердит его вручную.
        </p>
      </header>

      <form onSubmit={submit} noValidate className="space-y-4">
        <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-900 dark:ring-white/10 sm:p-5">
          <h2 className="font-bold text-zinc-950 dark:text-white">Контактные данные</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Ваше имя" error={errors.name}>
              <input value={values.name} onChange={(event) => setField("name", event.target.value)} autoComplete="name" placeholder="Ахмед" />
            </Field>
            <Field label="Номер телефона" error={errors.phone}>
              <input value={values.phone} onChange={(event) => setField("phone", event.target.value)} autoComplete="tel" inputMode="tel" placeholder="+7 999 000-00-00" />
            </Field>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-900 dark:ring-white/10 sm:p-5">
          <h2 className="font-bold text-zinc-950 dark:text-white">Способ получения</h2>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Choice checked={values.fulfillment === "delivery"} onClick={() => setField("fulfillment", "delivery")} label="Доставка" />
            <Choice checked={values.fulfillment === "pickup"} onClick={() => setField("fulfillment", "pickup")} label="Самовывоз" />
          </div>
          {values.fulfillment === "delivery" ? (
            <Field label="Адрес доставки" error={errors.address} className="mt-4">
              <textarea value={values.address} onChange={(event) => setField("address", event.target.value)} rows={2} placeholder="Грозный, улица, дом, квартира" />
            </Field>
          ) : (
            <p className="mt-4 rounded-xl bg-zinc-50 px-3.5 py-3 text-sm leading-5 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              Адрес и время готовности самовывоза уточнит сотрудник кафе.
            </p>
          )}
        </div>

        <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-900 dark:ring-white/10 sm:p-5">
          <h2 className="font-bold text-zinc-950 dark:text-white">Способ оплаты</h2>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Choice checked={values.payment === "cash"} onClick={() => setField("payment", "cash")} label="Наличными" />
            <Choice checked={values.payment === "transfer"} onClick={() => setField("payment", "transfer")} label="Переводом" />
          </div>

          <div className="mt-4">
            <label htmlFor="promo-code" className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Промокод</label>
            <div className="mt-2">
              <input
                id="promo-code"
                value={values.promoCode}
                onChange={(event) => setField("promoCode", event.target.value.toUpperCase())}
                maxLength={40}
                placeholder="Если есть"
                className="h-11 min-w-0 flex-1 rounded-xl border border-zinc-200 bg-white px-3.5 text-sm font-medium uppercase text-zinc-950 outline-none transition placeholder:font-normal placeholder:normal-case placeholder:text-zinc-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:focus:ring-orange-950"
              />
            </div>
          </div>
          <p className="mt-2 text-xs leading-5 text-zinc-500 dark:text-zinc-400">Если промокод действует, сотрудник пересчитает сумму и подтвердит скидку в WhatsApp.</p>
        </div>

        <section className="rounded-3xl bg-zinc-950 p-5 text-white ring-1 ring-white/10 dark:bg-white dark:text-zinc-950">
          <p className="text-sm text-zinc-400 dark:text-zinc-500">Итого к оплате</p>
          <p className="mt-1 text-3xl font-extrabold">{formatPrice(total)}</p>
          <Button type="submit" size="lg" className="mt-5 w-full">
            <MessageCircle size={19} />Отправить заказ в WhatsApp
          </Button>
          {generalError ? <p role="alert" className="mt-3 rounded-xl bg-red-500/15 px-3 py-2 text-sm text-red-200 dark:text-red-700">{generalError}</p> : null}
        </section>
      </form>

      {linkWasOpened ? (
        <section className="mt-4 rounded-3xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/40">
          <div className="flex gap-3">
            <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={21} />
            <div>
              <h2 className="font-bold text-emerald-950 dark:text-emerald-200">WhatsApp открыт</h2>
              <p className="mt-1 text-sm leading-5 text-emerald-800 dark:text-emerald-300">Проверьте сообщение и нажмите «Отправить». Корзина пока сохранена.</p>
              <button type="button" onClick={clearCart} className="mt-3 text-sm font-bold text-emerald-800 underline underline-offset-4 dark:text-emerald-300">
                Заказ отправлен — очистить корзину
              </button>
            </div>
          </div>
        </section>
      ) : null}
    </>
  );

  if (embedded) return <section className="mt-6">{content}</section>;

  return <main className="min-h-dvh bg-[#f7f7f6] pb-10 transition-colors dark:bg-zinc-950"><div className="mx-auto max-w-xl px-4 py-5 sm:px-6 sm:py-8">{content}</div></main>;
}

function Field({ label, error, className = "", children }: { label: string; error?: string; className?: string; children: ReactNode }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{label}</span>
      <div className="mt-2 [&_input]:h-11 [&_input]:w-full [&_input]:rounded-xl [&_input]:border [&_input]:border-zinc-200 [&_input]:bg-white [&_input]:px-3.5 [&_input]:text-sm [&_input]:text-zinc-950 [&_input]:outline-none [&_input]:transition [&_input:focus]:border-orange-400 [&_input:focus]:ring-2 [&_input:focus]:ring-orange-100 [&_textarea]:w-full [&_textarea]:resize-none [&_textarea]:rounded-xl [&_textarea]:border [&_textarea]:border-zinc-200 [&_textarea]:bg-white [&_textarea]:px-3.5 [&_textarea]:py-3 [&_textarea]:text-sm [&_textarea]:text-zinc-950 [&_textarea]:outline-none [&_textarea]:transition [&_textarea:focus]:border-orange-400 [&_textarea:focus]:ring-2 [&_textarea:focus]:ring-orange-100 dark:[&_input]:border-zinc-700 dark:[&_input]:bg-zinc-950 dark:[&_input]:text-white dark:[&_input:focus]:ring-orange-950 dark:[&_textarea]:border-zinc-700 dark:[&_textarea]:bg-zinc-950 dark:[&_textarea]:text-white dark:[&_textarea:focus]:ring-orange-950">
        {children}
      </div>
      {error ? <p role="alert" className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">{error}</p> : null}
    </label>
  );
}

function Choice({ checked, onClick, label }: { checked: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      onClick={onClick}
      className={`h-11 rounded-xl border text-sm font-bold transition ${checked ? "border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300" : "border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"}`}
    >
      {label}
    </button>
  );
}
