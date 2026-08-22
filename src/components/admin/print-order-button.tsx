"use client";

import { Printer } from "lucide-react";

export function PrintOrderButton() {
  return <button type="button" onClick={() => window.print()} className="print:hidden inline-flex min-h-11 items-center gap-2 rounded-xl bg-zinc-950 px-4 text-sm font-bold text-white"><Printer size={17} />Печать</button>;
}
