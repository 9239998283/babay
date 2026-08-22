import type { PublicOrderStatus } from "@/types/orders";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { readJsonBody, RequestValidationError, sha256 } from "@/lib/server/request";
import { publicOrderLookupSchema } from "@/lib/validation/orders";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orderNumber: string }> },
) {
  try {
    const { orderNumber } = await params;
    const body = await readJsonBody(request, 2048);
    const trackingToken = typeof body === "object" && body !== null && "trackingToken" in body
      ? (body as { trackingToken: unknown }).trackingToken
      : undefined;
    const parsed = publicOrderLookupSchema.safeParse({ orderNumber, trackingToken });
    if (!parsed.success) return Response.json({ error: "Заказ не найден." }, { status: 404 });

    const supabase = await getSupabaseServerClient();
    if (!supabase) return Response.json({ error: "Сервис заказов не настроен." }, { status: 503 });

    const { data, error } = await supabase.rpc("get_order_status", {
      p_order_number: parsed.data.orderNumber,
      p_public_token_hash: sha256(parsed.data.trackingToken),
    });

    if (error || !data) return Response.json({ error: "Заказ не найден." }, { status: 404 });
    return Response.json({ order: data as unknown as PublicOrderStatus }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof RequestValidationError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    return Response.json({ error: "Не удалось получить статус заказа." }, { status: 500 });
  }
}

