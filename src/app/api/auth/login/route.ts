import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { isAdminUser } from "@/lib/server/auth";
import { makeRateLimitKey, readJsonBody, RequestValidationError } from "@/lib/server/request";

const loginSchema = z.object({
  email: z.email().max(200),
  password: z.string().min(1).max(500),
}).strict();

export async function POST(request: Request) {
  try {
    const parsed = loginSchema.safeParse(await readJsonBody(request, 4096));
    if (!parsed.success) return Response.json({ error: "Введите email и пароль." }, { status: 422 });

    const supabase = await getSupabaseServerClient();
    if (!supabase) return Response.json({ error: "Вход не настроен." }, { status: 503 });
    const key = makeRateLimitKey(request, "login", parsed.data.email);
    const { data: limited } = await supabase.rpc("is_login_rate_limited", { p_key_hash: key });
    if (limited) return Response.json({ error: "Слишком много попыток. Повторите через 15 минут." }, { status: 429 });

    const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
    const success = !error && isAdminUser(data.user);
    await supabase.rpc("record_login_attempt", { p_key_hash: key, p_success: success });

    if (!success) {
      if (data.user) await supabase.auth.signOut({ scope: "local" });
      return Response.json({ error: "Неверный email или пароль." }, { status: 401 });
    }
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof RequestValidationError) return Response.json({ error: error.message }, { status: error.status });
    return Response.json({ error: "Не удалось выполнить вход." }, { status: 500 });
  }
}

