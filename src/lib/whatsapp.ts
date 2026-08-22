import type { CartLine } from "@/types/menu";
import type { CreatedOrder } from "@/types/orders";
import type { CheckoutValues } from "./validation/checkout";
import { formatPrice } from "./format";

export function cartLinePrice(line: CartLine) {
  return (line.item.price + line.selectedOptions.reduce((sum, option) => sum + option.price, 0)) * line.quantity;
}

export function cartTotal(lines: CartLine[]) {
  return lines.reduce((sum, line) => sum + cartLinePrice(line), 0);
}

export function buildWhatsAppMessage(lines: CartLine[], checkout: CheckoutValues, cartComment = "") {
  const orderLines = lines.map((line, index) => {
    const options = line.selectedOptions.length
      ? ` (${line.selectedOptions.map((option) => option.name).join(", ")})`
      : "";
    const itemComment = line.comment ? ` — ${line.comment}` : "";
    return `${index + 1}. ${line.item.name}${options}${itemComment} — ${line.quantity} шт. × ${formatPrice(line.item.price + line.selectedOptions.reduce((sum, option) => sum + option.price, 0))} = ${formatPrice(cartLinePrice(line))}`;
  });

  const details = [
    `Получение: ${checkout.fulfillment === "delivery" ? "доставка" : "самовывоз"}`,
    `Оплата: ${checkout.payment === "cash" ? "наличными" : "переводом"}`,
    `Клиент: ${checkout.name}`,
    `Телефон: ${checkout.phone}`,
    ...(checkout.fulfillment === "delivery" ? [`Адрес: ${checkout.address}`] : []),
    ...(checkout.promoCode ? [`Промокод: ${checkout.promoCode} (проверить)`] : []),
    ...(cartComment ? [`Комментарий к заказу: ${cartComment}`] : []),
  ];

  return ["Новый заказ B-Bay", "", ...orderLines, "", `Итого: ${formatPrice(cartTotal(lines))}`, "", ...details].join("\n");
}

export function makeWhatsAppLink(message = "", phoneOverride?: string) {
  const phone = (phoneOverride ?? process.env.NEXT_PUBLIC_WHATSAPP_PHONE ?? "").replace(/\D/g, "");
  if (!phone) return null;
  return `https://wa.me/${phone}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
}

export function buildSavedOrderWhatsAppMessage(
  order: CreatedOrder,
  lines: CartLine[],
  checkout: CheckoutValues,
  cartComment = "",
) {
  const orderLines = lines.map((line, index) => {
    const options = line.selectedOptions.length ? ` (${line.selectedOptions.map((option) => option.name).join(", ")})` : "";
    const comment = line.comment ? ` — ${line.comment}` : "";
    return `${index + 1}. ${line.item.name}${options}${comment} — ${line.quantity} шт.`;
  });
  return [
    `Заказ ${order.orderNumber} уже сохранён в B-Bay`,
    "",
    ...orderLines,
    "",
    `Сумма блюд: ${formatPrice(order.subtotal)}`,
    `Доставка: ${formatPrice(order.deliveryFee)}`,
    ...(order.discountAmount ? [`Скидка: −${formatPrice(order.discountAmount)}`] : []),
    `Итого: ${formatPrice(order.total)}`,
    "",
    `Клиент: ${checkout.name}`,
    `Телефон: ${checkout.phone}`,
    `Получение: ${checkout.fulfillment === "delivery" ? "доставка" : "самовывоз"}`,
    ...(checkout.fulfillment === "delivery" ? [`Адрес: ${checkout.address}`] : []),
    ...(cartComment ? [`Комментарий: ${cartComment}`] : []),
  ].join("\n");
}
