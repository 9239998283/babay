import type { AdminOrder } from "@/types/orders";
import { getAdminContext } from "@/lib/server/auth";
import { adminOrderFiltersSchema } from "@/lib/validation/orders";

export async function GET(request: Request) {
  const admin = await getAdminContext();
  if (!admin.ok) return Response.json({ error: admin.error }, { status: admin.status });

  const url = new URL(request.url);
  const raw = {
    search: url.searchParams.get("search") ?? "",
    status: url.searchParams.get("status") || undefined,
    dateFrom: url.searchParams.get("dateFrom") || undefined,
    dateTo: url.searchParams.get("dateTo") || undefined,
  };
  const parsed = adminOrderFiltersSchema.safeParse(raw);
  if (!parsed.success) return Response.json({ error: "Некорректные фильтры." }, { status: 422 });

  let query = admin.supabase
    .from("orders")
    .select(`
      id, order_number, created_at, updated_at, status_updated_at,
      customer_name, customer_phone, fulfillment_method, delivery_address,
      delivery_zone_id, delivery_zone_name, payment_method, promo_code,
      subtotal, discount_amount, delivery_fee, total, order_comment,
      status, cancelled_reason,
      order_items (id, item_name, unit_price, quantity, modifiers, modifiers_total, item_comment, line_total)
    `)
    .order("created_at", { ascending: false })
    .limit(200);

  const filters = parsed.data;
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.dateFrom) query = query.gte("created_at", `${filters.dateFrom}T00:00:00+03:00`);
  if (filters.dateTo) {
    const exclusiveEnd = new Date(`${filters.dateTo}T00:00:00+03:00`);
    exclusiveEnd.setUTCDate(exclusiveEnd.getUTCDate() + 1);
    query = query.lt("created_at", exclusiveEnd.toISOString());
  }
  if (filters.search) {
    const safeSearch = filters.search.replace(/[%_,().]/g, " ").replace(/\s+/g, " ").trim();
    if (safeSearch) {
      query = query.or(`order_number.ilike.%${safeSearch}%,customer_name.ilike.%${safeSearch}%,customer_phone.ilike.%${safeSearch}%`);
    }
  }

  const { data, error } = await query;
  if (error) return Response.json({ error: "Не удалось загрузить заказы." }, { status: 500 });
  return Response.json({ orders: (data ?? []) as unknown as AdminOrder[] }, { headers: { "Cache-Control": "no-store" } });
}
