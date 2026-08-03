import Link from "next/link";
import { LockKeyhole } from "lucide-react";

export function AdminAccess({ configured, email }: { configured: boolean; email?: string }) {
  return <main className="grid min-h-dvh place-items-center bg-[#f7f7f6] p-6"><section className="max-w-md rounded-3xl bg-white p-7 text-center shadow-sm ring-1 ring-zinc-950/5"><div className="mx-auto grid size-12 place-items-center rounded-2xl bg-orange-50 text-orange-600"><LockKeyhole size={22} /></div><h1 className="mt-4 text-2xl font-extrabold tracking-tight text-zinc-950">{configured ? "Недостаточно прав" : "Supabase ещё не настроен"}</h1><p className="mt-3 text-sm leading-6 text-zinc-500">{configured ? `Пользователь ${email ?? ""} вошёл в систему, но не имеет роли администратора. Назначьте app_metadata.role = admin по инструкции в README, затем войдите заново.` : "Добавьте значения из .env.example в .env.local и создайте таблицы через файл supabase/schema.sql."}</p><Link href={configured ? "/" : "/login"} className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-zinc-950 px-4 text-sm font-bold text-white">{configured ? "Вернуться к меню" : "Ко входу"}</Link></section></main>;
}
