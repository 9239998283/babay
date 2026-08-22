import { revalidatePath } from "next/cache";
import type { Json } from "@/types/database";
import { canTransitionOrderStatus, type OrderStatus } from "@/types/orders";
import { getAdminContext } from "@/lib/server/auth";
import { readJsonBody, RequestValidationError } from "@/lib/server/request";
import { adminOrderStatusSchema } from "@/lib/validation/orders";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getAdminContext();
  if (!admin.ok) return Response.json({ error: admin.error }, { status: admin.status });

  try {
    const { id } = await params;
    const parsedId = /^[0-9a-f-]{36}$/i.test(id) ? id : null;
    const parsed = adminOrderStatusSchema.safeParse(await readJsonBody(request, 4096));
    if (!parsedId || !parsed.success) return Response.json({ error: "Проверьте новый статус." }, { status: 422 });

    const { data: current, error: currentError } = await admin.supabase
      .from("orders")
      .select("id, order_number, status, cancelled_reason")
      .eq("id", parsedId)
      .single();
    if (currentError || !current) return Response.json({ error: "Заказ не найден." }, { status: 404 });

    const currentStatus = current.status as OrderStatus;
    if (!canTransitionOrderStatus(currentStatus, parsed.data.status)) {
      return Response.json({ error: "Этот переход статуса недоступен." }, { status: 409 });
    }

    const update = {
      status: parsed.data.status,
      cancelled_reason: parsed.data.status === "cancelled" ? parsed.data.cancelledReason ?? null : null,
    };
    const { data: order, error } = await admin.supabase
      .from("orders")
      .update(update)
      .eq("id", parsedId)
      .select("id, order_number, status, status_updated_at, cancelled_reason")
      .single();
    if (error || !order) return Response.json({ error: "Не удалось изменить статус." }, { status: 500 });

    await admin.supabase.from("admin_audit_log").insert({
      admin_user_id: admin.user.id,
      action: parsed.data.status === "cancelled" ? "order.cancel" : "order.status_change",
      entity_type: "order",
      entity_id: parsedId,
      before_data: current as unknown as Json,
      after_data: order as unknown as Json,
    });

    revalidatePath(`/order/${current.order_number}`);
    return Response.json({ order });
  } catch (error) {
    if (error instanceof RequestValidationError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    return Response.json({ error: "Не удалось изменить статус." }, { status: 500 });
  }
}

