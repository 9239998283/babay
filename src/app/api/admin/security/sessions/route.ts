import { getAdminContext } from "@/lib/server/auth";

export async function DELETE() {
  const admin = await getAdminContext();
  if (!admin.ok) return Response.json({ error: admin.error }, { status: admin.status });

  const { error } = await admin.supabase.auth.signOut({ scope: "others" });
  if (error) return Response.json({ error: "Не удалось завершить другие сессии." }, { status: 500 });
  await admin.supabase.from("admin_audit_log").insert({
    admin_user_id: admin.user.id,
    action: "other_sessions_revoked",
    entity_type: "auth_user",
    entity_id: admin.user.id,
    metadata: {},
  });
  return Response.json({ ok: true });
}
