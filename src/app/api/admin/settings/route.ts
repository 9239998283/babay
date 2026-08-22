import { revalidatePath } from "next/cache";
import type { Json } from "@/types/database";
import { getAdminContext } from "@/lib/server/auth";
import { readJsonBody, RequestValidationError } from "@/lib/server/request";
import { restaurantSettingsSchema } from "@/lib/validation/orders";

export async function PATCH(request: Request) {
  const admin = await getAdminContext();
  if (!admin.ok) return Response.json({ error: admin.error }, { status: admin.status });

  try {
    const parsed = restaurantSettingsSchema.safeParse(await readJsonBody(request, 32 * 1024));
    if (!parsed.success) {
      return Response.json({ error: "Проверьте настройки.", fields: parsed.error.flatten().fieldErrors }, { status: 422 });
    }

    const { data: before } = await admin.supabase.from("restaurant_settings").select("*").eq("id", true).single();
    const { data, error } = await admin.supabase
      .from("restaurant_settings")
      .update({ ...parsed.data, opening_hours: parsed.data.opening_hours, updated_by: admin.user.id })
      .eq("id", true)
      .select("*")
      .single();
    if (error || !data) return Response.json({ error: "Не удалось сохранить настройки." }, { status: 500 });

    await admin.supabase.from("admin_audit_log").insert({
      admin_user_id: admin.user.id,
      action: "settings.update",
      entity_type: "restaurant_settings",
      entity_id: "main",
      before_data: before as unknown as Json,
      after_data: data as unknown as Json,
    });

    revalidatePath("/");
    revalidatePath("/cart");
    return Response.json({ settings: data });
  } catch (error) {
    if (error instanceof RequestValidationError) return Response.json({ error: error.message }, { status: error.status });
    return Response.json({ error: "Не удалось сохранить настройки." }, { status: 500 });
  }
}

