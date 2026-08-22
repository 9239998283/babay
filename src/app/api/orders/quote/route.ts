import type { Json } from "@/types/database";
import type { OrderQuote } from "@/types/orders";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getDatabaseErrorMessage, readJsonBody, RequestValidationError } from "@/lib/server/request";
import { orderQuoteRequestSchema } from "@/lib/validation/orders";

export async function POST(request: Request) {
  try {
    const parsed = orderQuoteRequestSchema.safeParse(await readJsonBody(request));
    if (!parsed.success) {
      return Response.json({ error: "Проверьте параметры заказа.", fields: parsed.error.flatten().fieldErrors }, { status: 422 });
    }

    const supabase = await getSupabaseServerClient();
    if (!supabase) return Response.json({ error: "Сервис заказов не настроен." }, { status: 503 });

    const { data, error } = await supabase.rpc("quote_order", {
      p_items: parsed.data.items as unknown as Json,
      p_fulfillment_method: parsed.data.fulfillmentMethod,
      p_delivery_zone_id: parsed.data.fulfillmentMethod === "delivery" ? parsed.data.deliveryZoneId : null,
      p_promo_code: parsed.data.promoCode || null,
    });

    if (error || !data) {
      return Response.json({ error: getDatabaseErrorMessage(error?.message ?? "") }, { status: 422 });
    }

    return Response.json({ quote: data as unknown as OrderQuote }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof RequestValidationError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    return Response.json({ error: "Не удалось рассчитать заказ." }, { status: 500 });
  }
}

