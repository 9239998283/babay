import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Json } from "@/types/database";
import { getAdminContext } from "@/lib/server/auth";
import { readJsonBody, RequestValidationError } from "@/lib/server/request";

const schema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(200),
  available: z.boolean(),
}).strict();

export async function PATCH(request: Request) {
  const admin = await getAdminContext();
  if (!admin.ok) return Response.json({ error: admin.error }, { status: admin.status });

  try {
    const parsed = schema.safeParse(await readJsonBody(request, 16 * 1024));
    if (!parsed.success) return Response.json({ error: "Проверьте выбранные блюда." }, { status: 422 });

    const { data: before, error: readError } = await admin.supabase
      .from("menu_items")
      .select("id, name, is_available")
      .in("id", parsed.data.ids);
    if (readError || before?.length !== parsed.data.ids.length) {
      return Response.json({ error: "Не все блюда найдены." }, { status: 404 });
    }

    const { data, error } = await admin.supabase
      .from("menu_items")
      .update({ is_available: parsed.data.available })
      .in("id", parsed.data.ids)
      .select("id, is_available");
    if (error) return Response.json({ error: "Не удалось изменить доступность." }, { status: 500 });

    await admin.supabase.from("admin_audit_log").insert({
      admin_user_id: admin.user.id,
      action: "menu.availability_change",
      entity_type: "menu_item",
      metadata: { ids: parsed.data.ids, available: parsed.data.available } as unknown as Json,
      before_data: before as unknown as Json,
      after_data: data as unknown as Json,
    });

    revalidatePath("/");
    return Response.json({ items: data });
  } catch (error) {
    if (error instanceof RequestValidationError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    return Response.json({ error: "Не удалось изменить доступность." }, { status: 500 });
  }
}

