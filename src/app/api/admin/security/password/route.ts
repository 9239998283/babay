import { z } from "zod";
import { getAdminContext } from "@/lib/server/auth";
import { makeRateLimitKey, readJsonBody, RequestValidationError } from "@/lib/server/request";

const passwordSchema = z.object({
  currentPassword: z.string().min(1).max(500),
  newPassword: z.string().min(10, "Новый пароль должен содержать не менее 10 символов.").max(500),
}).strict().refine((value) => value.currentPassword !== value.newPassword, {
  message: "Новый пароль должен отличаться от текущего.",
  path: ["newPassword"],
});

export async function POST(request: Request) {
  try {
    const admin = await getAdminContext();
    if (!admin.ok) return Response.json({ error: admin.error }, { status: admin.status });
    const parsed = passwordSchema.safeParse(await readJsonBody(request, 4096));
    if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message ?? "Проверьте пароль." }, { status: 422 });
    if (!admin.user.email) return Response.json({ error: "У учётной записи нет email." }, { status: 409 });

    const key = makeRateLimitKey(request, "password-change", admin.user.id);
    const { data: limited } = await admin.supabase.rpc("is_login_rate_limited", { p_key_hash: key });
    if (limited) return Response.json({ error: "Слишком много попыток. Повторите через 15 минут." }, { status: 429 });

    const { error: reauthError } = await admin.supabase.auth.signInWithPassword({
      email: admin.user.email,
      password: parsed.data.currentPassword,
    });
    await admin.supabase.rpc("record_login_attempt", { p_key_hash: key, p_success: !reauthError });
    if (reauthError) return Response.json({ error: "Текущий пароль указан неверно." }, { status: 401 });

    const { error: updateError } = await admin.supabase.auth.updateUser({ password: parsed.data.newPassword });
    if (updateError) return Response.json({ error: "Не удалось изменить пароль." }, { status: 500 });
    await admin.supabase.auth.signOut({ scope: "others" });
    await admin.supabase.from("admin_audit_log").insert({
      admin_user_id: admin.user.id,
      action: "password_changed",
      entity_type: "auth_user",
      entity_id: admin.user.id,
      metadata: { other_sessions_revoked: true },
    });
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof RequestValidationError) return Response.json({ error: error.message }, { status: error.status });
    return Response.json({ error: "Не удалось изменить пароль." }, { status: 500 });
  }
}
