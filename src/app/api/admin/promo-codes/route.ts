import { z } from "zod";
import type { Json } from "@/types/database";
import { getAdminContext } from "@/lib/server/auth";
import { readJsonBody, RequestValidationError } from "@/lib/server/request";
import { promoCodeSchema } from "@/lib/validation/orders";

const requestSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("save"), promo: promoCodeSchema }).strict(),
  z.object({ action: z.literal("delete"), code: z.string().trim().min(2).max(40), confirmed: z.literal(true) }).strict(),
]);

export async function POST(request: Request) {
  const admin = await getAdminContext();
  if (!admin.ok) return Response.json({ error: admin.error }, { status: admin.status });
  try {
    const parsed = requestSchema.safeParse(await readJsonBody(request, 16 * 1024));
    if (!parsed.success) return Response.json({ error: "Проверьте промокод." }, { status: 422 });

    if (parsed.data.action === "delete") {
      const code = parsed.data.code.toUpperCase();
      const { data: before } = await admin.supabase.from("promo_codes").select("*").eq("code", code).single();
      const { error } = await admin.supabase.from("promo_codes").delete().eq("code", code);
      if (error) return Response.json({ error: "Не удалось удалить промокод." }, { status: 500 });
      await admin.supabase.from("admin_audit_log").insert({
        admin_user_id: admin.user.id,
        action: "promo.delete",
        entity_type: "promo_code",
        entity_id: code,
        before_data: before as unknown as Json,
      });
      return Response.json({ deleted: true });
    }

    const promo = parsed.data.promo;
    const { data: before } = await admin.supabase.from("promo_codes").select("*").eq("code", promo.code).maybeSingle();
    const { data, error } = await admin.supabase.from("promo_codes").upsert(promo).select("*").single();
    if (error || !data) return Response.json({ error: "Не удалось сохранить промокод." }, { status: 500 });
    await admin.supabase.from("admin_audit_log").insert({
      admin_user_id: admin.user.id,
      action: before ? "promo.update" : "promo.create",
      entity_type: "promo_code",
      entity_id: promo.code,
      before_data: before as unknown as Json,
      after_data: data as unknown as Json,
    });
    return Response.json({ promo: data });
  } catch (error) {
    if (error instanceof RequestValidationError) return Response.json({ error: error.message }, { status: error.status });
    return Response.json({ error: "Не удалось изменить промокод." }, { status: 500 });
  }
}

