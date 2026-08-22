import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Json } from "@/types/database";
import { getAdminContext } from "@/lib/server/auth";
import { readJsonBody, RequestValidationError } from "@/lib/server/request";
import { deliveryZoneSchema } from "@/lib/validation/orders";

const requestSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("save"), zone: deliveryZoneSchema }).strict(),
  z.object({ action: z.literal("delete"), id: z.string().uuid(), confirmed: z.literal(true) }).strict(),
]);

export async function POST(request: Request) {
  const admin = await getAdminContext();
  if (!admin.ok) return Response.json({ error: admin.error }, { status: admin.status });

  try {
    const parsed = requestSchema.safeParse(await readJsonBody(request, 16 * 1024));
    if (!parsed.success) return Response.json({ error: "Проверьте зону доставки." }, { status: 422 });

    if (parsed.data.action === "delete") {
      const { data: before } = await admin.supabase.from("delivery_zones").select("*").eq("id", parsed.data.id).single();
      const { error } = await admin.supabase.from("delivery_zones").delete().eq("id", parsed.data.id);
      if (error) return Response.json({ error: "Не удалось удалить зону." }, { status: 500 });
      await admin.supabase.from("admin_audit_log").insert({
        admin_user_id: admin.user.id,
        action: "delivery_zone.delete",
        entity_type: "delivery_zone",
        entity_id: parsed.data.id,
        before_data: before as unknown as Json,
      });
      revalidatePath("/");
      return Response.json({ deleted: true });
    }

    const { id, ...zone } = parsed.data.zone;
    const { data: before } = id
      ? await admin.supabase.from("delivery_zones").select("*").eq("id", id).maybeSingle()
      : { data: null };
    const mutation = id
      ? admin.supabase.from("delivery_zones").update(zone).eq("id", id).select("*").single()
      : admin.supabase.from("delivery_zones").insert(zone).select("*").single();
    const { data, error } = await mutation;
    if (error || !data) return Response.json({ error: "Не удалось сохранить зону." }, { status: 500 });
    await admin.supabase.from("admin_audit_log").insert({
      admin_user_id: admin.user.id,
      action: id ? "delivery_zone.update" : "delivery_zone.create",
      entity_type: "delivery_zone",
      entity_id: data.id,
      before_data: before as unknown as Json,
      after_data: data as unknown as Json,
    });
    revalidatePath("/");
    return Response.json({ zone: data });
  } catch (error) {
    if (error instanceof RequestValidationError) return Response.json({ error: error.message }, { status: error.status });
    return Response.json({ error: "Не удалось изменить зону доставки." }, { status: 500 });
  }
}

