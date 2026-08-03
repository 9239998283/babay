import type { ReactNode } from "react";

export function EmptyState({ icon, title, description, action }: { icon: ReactNode; title: string; description: string; action?: ReactNode }) {
  return (
    <div className="rounded-3xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center">
      <div className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl bg-orange-50 text-orange-600">{icon}</div>
      <h2 className="text-lg font-bold text-zinc-950">{title}</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-zinc-500">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
