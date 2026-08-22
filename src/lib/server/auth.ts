import "server-only";

import { getSupabaseServerClient } from "@/lib/supabase/server";
export { isAdminUser } from "@/lib/auth/roles";
import { isAdminUser } from "@/lib/auth/roles";

export async function getAdminContext() {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return { ok: false as const, status: 503, error: "not_configured" };

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { ok: false as const, status: 401, error: "unauthorized" };
  if (!isAdminUser(user)) return { ok: false as const, status: 403, error: "forbidden" };

  return { ok: true as const, supabase, user };
}
