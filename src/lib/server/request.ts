import "server-only";

import { createHash } from "node:crypto";

const MAX_JSON_BYTES = 64 * 1024;

export class RequestValidationError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
  }
}

export async function readJsonBody(request: Request, maxBytes = MAX_JSON_BYTES): Promise<unknown> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    throw new RequestValidationError("Ожидается JSON", 415);
  }

  const declaredSize = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(declaredSize) && declaredSize > maxBytes) {
    throw new RequestValidationError("Запрос слишком большой", 413);
  }

  const body = await request.text();
  if (Buffer.byteLength(body, "utf8") > maxBytes) {
    throw new RequestValidationError("Запрос слишком большой", 413);
  }

  try {
    return JSON.parse(body) as unknown;
  } catch {
    throw new RequestValidationError("Некорректный JSON");
  }
}

export function getClientIp(request: Request) {
  return (request.headers.get("x-forwarded-for")?.split(",")[0] ?? request.headers.get("x-real-ip") ?? "unknown").trim();
}

export function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function makeRateLimitKey(request: Request, purpose: string, discriminator = "") {
  const secret = process.env.AUTH_RATE_LIMIT_SECRET ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "b-bay-local";
  return sha256(`${purpose}:${secret}:${getClientIp(request)}:${discriminator.toLowerCase()}`);
}

export function getDatabaseErrorMessage(message: string) {
  const known: Record<string, string> = {
    INVALID_ITEMS: "Проверьте состав корзины.",
    INVALID_ITEM_INPUT: "Одно из блюд передано некорректно.",
    INVALID_QUANTITY: "Некорректное количество блюда.",
    ITEM_UNAVAILABLE: "Одно из блюд больше недоступно. Обновите корзину.",
    MODIFIER_UNAVAILABLE: "Одна из добавок больше недоступна. Обновите корзину.",
    DELIVERY_ZONE_REQUIRED: "Выберите зону доставки.",
    DELIVERY_ZONE_UNAVAILABLE: "Выбранная зона доставки сейчас недоступна.",
    MINIMUM_ORDER_NOT_MET: "Сумма блюд меньше минимальной суммы заказа.",
    PROMO_INVALID: "Промокод недействителен или не подходит к этому заказу.",
    ORDERS_CLOSED: "Приём заказов сейчас закрыт.",
    PAYMENT_METHOD_UNAVAILABLE: "Выбранный способ оплаты недоступен.",
    IDEMPOTENCY_CONFLICT: "Не удалось безопасно повторить запрос. Обновите страницу.",
  };
  return known[message] ?? "Не удалось обработать заказ. Попробуйте ещё раз.";
}

