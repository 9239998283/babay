"use client";

import Link from "next/link";
import { CheckCircle2, LoaderCircle, MessageCircle, PackageOpen, ReceiptText } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatPrice } from "@/lib/format";
import { saveOrderReference } from "@/lib/order-history";
import { checkoutSchema, type CheckoutValues } from "@/lib/validation/checkout";
import { formatRussianPhoneInput } from "@/lib/validation/phone";
import { buildSavedOrderWhatsAppMessage, makeWhatsAppLink } from "@/lib/whatsapp";
import { isRestaurantAcceptingOrders } from "@/lib/restaurant-hours";
import { useCart } from "@/store/cart-store";
import type { CartLine } from "@/types/menu";
import type { CreatedOrder, OrderQuote } from "@/types/orders";
import type { PublicRestaurantConfig } from "@/types/restaurant";

type CheckoutFormValues = CheckoutValues & { deliveryZoneId: string };
type FieldErrors = Partial<Record<keyof CheckoutFormValues, string>>;

type SuccessState = {
  order: CreatedOrder;
  lines: CartLine[];
  checkout: CheckoutValues;
  orderComment: string;
};

type QuoteResult = { key: string; quote?: OrderQuote; error?: string };

function makeInitialValues(config: PublicRestaurantConfig): CheckoutFormValues {
  return {
    name: "",
    phone: "",
    fulfillment: "delivery",
    payment: (config.settings.payment_methods[0] as CheckoutValues["payment"] | undefined) ?? "cash",
    address: "",
    promoCode: "",
    deliveryZoneId: config.deliveryZones[0]?.id ?? "",
  };
}

function toOrderLines(lines: CartLine[]) {
  return lines.map((line) => ({
    menuItemId: line.item.id,
    quantity: line.quantity,
    modifierIds: line.selectedOptions.map((option) => option.id),
    comment: line.comment,
  }));
}

export function CheckoutForm({ config, embedded = false, onSuccess }: { config: PublicRestaurantConfig; embedded?: boolean; onSuccess?: () => void }) {
  const { lines, orderComment, clearCart } = useCart();
  const ordersAreOpen = isRestaurantAcceptingOrders(config.settings);
  const [values, setValues] = useState<CheckoutFormValues>(() => makeInitialValues(config));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof CheckoutFormValues, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [quoteResult, setQuoteResult] = useState<QuoteResult | null>(null);
  const [quoteLoadingKey, setQuoteLoadingKey] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState("");
  const [success, setSuccess] = useState<SuccessState | null>(null);
  const idempotencyKeyRef = useRef<string | null>(null);
  const trackingTokenRef = useRef<string | null>(null);

  const orderLines = useMemo(() => toOrderLines(lines), [lines]);
  const quoteKey = useMemo(() => JSON.stringify({ items: orderLines, fulfillment: values.fulfillment, deliveryZoneId: values.deliveryZoneId, promoCode: values.promoCode }), [orderLines, values.deliveryZoneId, values.fulfillment, values.promoCode]);
  const quote = quoteResult?.key === quoteKey ? quoteResult.quote ?? null : null;
  const quoteError = quoteResult?.key === quoteKey ? quoteResult.error ?? "" : "";
  const quoteLoading = quoteLoadingKey === quoteKey;
  const checkoutValidation = checkoutSchema.safeParse(values);
  const clientFieldErrors = checkoutValidation.success ? {} : checkoutValidation.error.flatten().fieldErrors;
  const deliveryReady = values.fulfillment === "pickup" || Boolean(values.deliveryZoneId);
  const canSubmit = checkoutValidation.success
    && deliveryReady
    && Boolean(quote)
    && !quoteError
    && !quoteLoading
    && !submitting
    && ordersAreOpen;

  useEffect(() => {
    if (!lines.length || !deliveryReady) return;

    const controller = new AbortController();
    const requestKey = quoteKey;
    const timeout = window.setTimeout(async () => {
      setQuoteLoadingKey(requestKey);
      try {
        const response = await fetch("/api/orders/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: orderLines,
            fulfillmentMethod: values.fulfillment,
            deliveryZoneId: values.fulfillment === "delivery" ? values.deliveryZoneId || null : null,
            promoCode: values.promoCode,
          }),
          signal: controller.signal,
        });
        const payload = await response.json() as { quote?: OrderQuote; error?: string };
        if (!response.ok || !payload.quote) {
          setQuoteResult({ key: requestKey, error: payload.error ?? "Не удалось рассчитать заказ." });
          return;
        }
        setQuoteResult({ key: requestKey, quote: payload.quote });
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setQuoteResult({ key: requestKey, error: "Нет связи с сервером расчёта." });
        }
      } finally {
        if (!controller.signal.aborted) setQuoteLoadingKey((current) => current === requestKey ? "" : current);
      }
    }, 350);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [deliveryReady, lines.length, orderLines, quoteKey, values.deliveryZoneId, values.fulfillment, values.promoCode]);

  function setField<K extends keyof CheckoutFormValues>(field: K, value: CheckoutFormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setGeneralError("");
  }

  function fieldError(field: keyof CheckoutFormValues) {
    if (errors[field]) return errors[field];
    if (!(submitted || touched[field])) return undefined;
    if (field === "deliveryZoneId" && values.fulfillment === "delivery" && !values.deliveryZoneId) return "Выберите зону доставки";
    return clientFieldErrors[field]?.[0];
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitted(true);
    setGeneralError("");
    if (!lines.length) return setGeneralError("Корзина пуста. Добавьте блюда перед оформлением.");
    if (!ordersAreOpen) return setGeneralError("Приём заказов сейчас закрыт.");

    const validation = checkoutSchema.safeParse(values);
    if (!validation.success || !deliveryReady || !quote) {
      if (!validation.success) {
        const fields = validation.error.flatten().fieldErrors;
        setErrors(Object.fromEntries(Object.entries(fields).map(([key, messages]) => [key, messages?.[0]])) as FieldErrors);
      }
      if (!deliveryReady) setErrors((current) => ({ ...current, deliveryZoneId: "Выберите зону доставки" }));
      return;
    }

    idempotencyKeyRef.current ??= crypto.randomUUID();
    trackingTokenRef.current ??= crypto.randomUUID();
    const lineSnapshot = lines.map((line) => ({ ...line, selectedOptions: [...line.selectedOptions] }));
    const commentSnapshot = orderComment;
    setSubmitting(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idempotencyKey: idempotencyKeyRef.current,
          trackingToken: trackingTokenRef.current,
          customerName: validation.data.name,
          customerPhone: validation.data.phone,
          fulfillmentMethod: validation.data.fulfillment,
          deliveryAddress: validation.data.address,
          deliveryZoneId: validation.data.fulfillment === "delivery" ? values.deliveryZoneId : null,
          paymentMethod: validation.data.payment,
          promoCode: validation.data.promoCode,
          orderComment,
          items: orderLines,
        }),
      });
      const payload = await response.json() as { order?: CreatedOrder; error?: string };
      if (!response.ok || !payload.order) {
        setGeneralError(payload.error ?? "Не удалось сохранить заказ.");
        return;
      }

      saveOrderReference(payload.order);
      setSuccess({ order: payload.order, lines: lineSnapshot, checkout: validation.data, orderComment: commentSnapshot });
      onSuccess?.();
      clearCart();
    } catch {
      setGeneralError("Нет связи с сервером. Повторите отправку — заказ не продублируется.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    const statusHref = `/order/${success.order.orderNumber}#token=${encodeURIComponent(success.order.trackingToken)}`;
    const whatsAppMessage = buildSavedOrderWhatsAppMessage(success.order, success.lines, success.checkout, success.orderComment);
    const whatsAppLink = makeWhatsAppLink(whatsAppMessage, config.settings.whatsapp_phone);
    return (
      <section className="mt-6 rounded-[2rem] border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900 dark:bg-emerald-950/40 sm:p-6" aria-labelledby="order-success-title">
        <CheckCircle2 className="text-emerald-600" size={34} />
        <p className="mt-4 text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">Заказ принят системой</p>
        <h2 id="order-success-title" className="mt-1 text-2xl font-extrabold text-emerald-950 dark:text-emerald-100">
          Заказ {success.order.orderNumber}
        </h2>
        <p className="mt-2 text-sm leading-6 text-emerald-800 dark:text-emerald-200">
          Заказ сохранён на сервере. Текущий статус — «Новый». Кафе увидит его в админ-панели.
        </p>
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <Link href={statusHref} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-bold text-white hover:bg-emerald-800">
            <ReceiptText size={18} /> Смотреть статус
          </Link>
          {whatsAppLink ? (
            <a href={whatsAppLink} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-emerald-800 ring-1 ring-emerald-200 hover:bg-emerald-100">
              <MessageCircle size={18} /> Открыть WhatsApp
            </a>
          ) : null}
        </div>
      </section>
    );
  }

  if (!lines.length) {
    if (embedded) return null;
    return (
      <main className="min-h-dvh bg-[#f7f7f6] px-4 py-6 dark:bg-zinc-950 sm:px-6">
        <div className="mx-auto max-w-xl pt-8">
          <EmptyState icon={<PackageOpen size={23} />} title="Нечего оформлять" description="Добавьте блюда в корзину, затем вернитесь к оформлению." action={<Link href="/" className="inline-flex h-11 items-center justify-center rounded-xl bg-orange-500 px-4 text-sm font-bold text-white">Открыть меню</Link>} />
        </div>
      </main>
    );
  }

  const content = (
    <>
      <header className={embedded ? "mb-5" : "mt-5"}>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-orange-600">Последний шаг</p>
        {embedded ? <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-zinc-950 dark:text-white">Оформление заказа</h2> : <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-white">Оформление заказа</h1>}
        <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">Сначала заказ сохранится в системе. После этого можно продублировать его в WhatsApp.</p>
      </header>

      {!ordersAreOpen ? <p role="alert" className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:bg-red-950/40 dark:text-red-300">Приём заказов временно закрыт. Меню доступно для просмотра.</p> : null}

      <form onSubmit={submit} noValidate className="space-y-4">
        <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-900 dark:ring-white/10 sm:p-5">
          <h2 className="font-bold text-zinc-950 dark:text-white">Контактные данные</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Ваше имя" error={fieldError("name")}>
              <input aria-invalid={Boolean(fieldError("name"))} value={values.name} onBlur={() => setTouched((current) => ({ ...current, name: true }))} onChange={(event) => setField("name", event.target.value)} autoComplete="name" placeholder="Ахмед" />
            </Field>
            <Field label="Номер телефона" error={fieldError("phone")}>
              <input aria-invalid={Boolean(fieldError("phone"))} value={values.phone} onBlur={() => setTouched((current) => ({ ...current, phone: true }))} onChange={(event) => setField("phone", formatRussianPhoneInput(event.target.value))} autoComplete="tel" inputMode="tel" placeholder="+7 999 000-00-00" />
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
            <>
              <label className="mt-4 block text-sm font-semibold text-zinc-800 dark:text-zinc-200">Зона доставки
                <select aria-invalid={Boolean(fieldError("deliveryZoneId"))} value={values.deliveryZoneId} onBlur={() => setTouched((current) => ({ ...current, deliveryZoneId: true }))} onChange={(event) => setField("deliveryZoneId", event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-zinc-200 bg-white px-3.5 text-sm text-zinc-950 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white">
                  <option value="">Выберите зону</option>
                  {config.deliveryZones.map((zone) => <option key={zone.id} value={zone.id}>{zone.name} · {zone.fee ? formatPrice(zone.fee) : "бесплатно"}</option>)}
                </select>
                {fieldError("deliveryZoneId") ? <span role="alert" className="mt-1.5 block text-xs font-medium text-red-600">{fieldError("deliveryZoneId")}</span> : null}
              </label>
              <Field label="Адрес доставки" error={fieldError("address")} className="mt-4">
                <textarea aria-invalid={Boolean(fieldError("address"))} value={values.address} onBlur={() => setTouched((current) => ({ ...current, address: true }))} onChange={(event) => setField("address", event.target.value)} rows={2} placeholder="Грозный, улица, дом, квартира" />
              </Field>
            </>
          ) : (
            <p className="mt-4 rounded-xl bg-zinc-50 px-3.5 py-3 text-sm leading-5 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">Самовывоз: {config.settings.address}. Примерно {config.settings.preparation_minutes} мин.</p>
          )}
        </div>

        <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-900 dark:ring-white/10 sm:p-5">
          <h2 className="font-bold text-zinc-950 dark:text-white">Способ оплаты</h2>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {config.settings.payment_methods.includes("cash") ? <Choice checked={values.payment === "cash"} onClick={() => setField("payment", "cash")} label="Наличными" /> : null}
            {config.settings.payment_methods.includes("transfer") ? <Choice checked={values.payment === "transfer"} onClick={() => setField("payment", "transfer")} label="Переводом" /> : null}
          </div>
          <Field label="Промокод" error={quoteError && values.promoCode ? quoteError : undefined} className="mt-4">
            <input value={values.promoCode} onChange={(event) => setField("promoCode", event.target.value.toUpperCase())} maxLength={40} placeholder="Если есть" />
          </Field>
        </div>

        <section className="rounded-3xl bg-zinc-950 p-5 text-white ring-1 ring-white/10 dark:bg-white dark:text-zinc-950" aria-live="polite">
          {quoteLoading ? <p className="flex items-center gap-2 text-sm text-zinc-300 dark:text-zinc-600"><LoaderCircle size={17} className="animate-spin" />Считаем актуальные цены, скидку и доставку…</p> : quote ? (
            <div className="space-y-2 text-sm">
              <PriceRow label="Стоимость блюд" value={formatPrice(quote.subtotal)} />
              <PriceRow label="Доставка" value={quote.deliveryFee ? formatPrice(quote.deliveryFee) : "Бесплатно"} />
              <PriceRow label="Скидка" value={quote.discountAmount ? `−${formatPrice(quote.discountAmount)}` : "0 ₽"} />
              <div className="mt-3 flex items-end justify-between gap-4 border-t border-white/15 pt-3 dark:border-zinc-200"><span className="font-semibold">Итого</span><span className="text-3xl font-extrabold">{formatPrice(quote.total)}</span></div>
            </div>
          ) : <p className="text-sm leading-6 text-zinc-300 dark:text-zinc-600">Итог появится после серверного расчёта доставки и скидки.</p>}
          <Button type="submit" size="lg" className="mt-5 w-full" disabled={!canSubmit} aria-disabled={!canSubmit}>
            {submitting ? <LoaderCircle className="animate-spin" size={19} /> : <ReceiptText size={19} />}{submitting ? "Сохраняем заказ…" : "Оформить заказ"}
          </Button>
          {quoteError && !values.promoCode ? <p role="alert" className="mt-3 rounded-xl bg-red-500/15 px-3 py-2 text-sm text-red-200 dark:text-red-700">{quoteError}</p> : null}
          {generalError ? <p role="alert" className="mt-3 rounded-xl bg-red-500/15 px-3 py-2 text-sm text-red-200 dark:text-red-700">{generalError}</p> : null}
        </section>
      </form>
    </>
  );

  if (embedded) return <section className="mt-6">{content}</section>;
  return <main className="min-h-dvh bg-[#f7f7f6] pb-10 dark:bg-zinc-950"><div className="mx-auto max-w-xl px-4 py-5 sm:px-6 sm:py-8">{content}</div></main>;
}

function Field({ label, error, className = "", children }: { label: string; error?: string; className?: string; children: ReactNode }) {
  return <label className={`block ${className}`}><span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{label}</span><div className="mt-2 [&_input]:h-11 [&_input]:w-full [&_input]:rounded-xl [&_input]:border [&_input]:border-zinc-200 [&_input]:bg-white [&_input]:px-3.5 [&_input]:text-sm [&_input]:text-zinc-950 [&_input]:outline-none [&_input:focus]:border-orange-400 [&_input:focus]:ring-2 [&_input:focus]:ring-orange-100 [&_textarea]:w-full [&_textarea]:resize-none [&_textarea]:rounded-xl [&_textarea]:border [&_textarea]:border-zinc-200 [&_textarea]:bg-white [&_textarea]:px-3.5 [&_textarea]:py-3 [&_textarea]:text-sm [&_textarea]:text-zinc-950 [&_textarea]:outline-none [&_textarea:focus]:border-orange-400 [&_textarea:focus]:ring-2 [&_textarea:focus]:ring-orange-100 dark:[&_input]:border-zinc-700 dark:[&_input]:bg-zinc-950 dark:[&_input]:text-white dark:[&_textarea]:border-zinc-700 dark:[&_textarea]:bg-zinc-950 dark:[&_textarea]:text-white">{children}</div>{error ? <p role="alert" className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">{error}</p> : null}</label>;
}

function Choice({ checked, onClick, label }: { checked: boolean; onClick: () => void; label: string }) {
  return <button type="button" aria-pressed={checked} onClick={onClick} className={`min-h-11 rounded-xl border px-3 text-sm font-bold transition ${checked ? "border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300" : "border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300"}`}>{label}</button>;
}

function PriceRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-4"><span className="text-zinc-400 dark:text-zinc-500">{label}</span><span className="font-bold">{value}</span></div>;
}
