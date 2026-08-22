import type { Json } from "@/types/database";
import type { CreatedOrder } from "@/types/orders";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  getDatabaseErrorMessage,
  makeRateLimitKey,
  readJsonBody,
  RequestValidationError,
  sha256,
} from "@/lib/server/request";
import { createOrderRequestSchema } from "@/lib/validation/orders";

export async function POST(request: Request) {
  try {
    const parsed = createOrderRequestSchema.safeParse(await readJsonBody(request));
    if (!parsed.success) {
      return Response.json({ error: "Проверьте данные заказа.", fields: parsed.error.flatten().fieldErrors }, { status: 422 });
    }

    const supabase = await getSupabaseServerClient();
    if (!supabase) return Response.json({ error: "Сервис заказов не настроен." }, { status: 503 });

    const rateLimitKey = makeRateLimitKey(request, "order");
    const { data: allowed, error: rateLimitError } = await supabase.rpc("consume_order_rate_limit", {
      p_key_hash: rateLimitKey,
    });
    if (rateLimitError) return Response.json({ error: "Не удалось проверить запрос. Повторите позже." }, { status: 503 });
    if (!allowed) return Response.json({ error: "Слишком много попыток. Подождите несколько минут." }, { status: 429 });

    const input = parsed.data;
    const { data, error } = await supabase.rpc("place_order", {
      p_idempotency_key: input.idempotencyKey,
      p_public_token_hash: sha256(input.trackingToken),
      p_customer_name: input.customerName,
      p_customer_phone: input.customerPhone,
      p_fulfillment_method: input.fulfillmentMethod,
      p_delivery_address: input.fulfillmentMethod === "delivery" ? input.deliveryAddress : null,
      p_delivery_zone_id: input.fulfillmentMethod === "delivery" ? input.deliveryZoneId : null,
      p_payment_method: input.paymentMethod,
      p_promo_code: input.promoCode || null,
      p_order_comment: input.orderComment || null,
      p_items: input.items as unknown as Json,
    });

    if (error || !data) {
      return Response.json({ error: getDatabaseErrorMessage(error?.message ?? "") }, { status: 422 });
    }

    const order = { ...(data as unknown as Omit<CreatedOrder, "trackingToken">), trackingToken: input.trackingToken };
    return Response.json({ order }, { status: order.duplicate ? 200 : 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof RequestValidationError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    return Response.json({ error: "Не удалось сохранить заказ. Попробуйте ещё раз." }, { status: 500 });
  }
}

