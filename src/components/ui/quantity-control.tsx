"use client";

import { Minus, Plus } from "lucide-react";

type QuantityControlProps = {
  quantity: number;
  onChange: (quantity: number) => void;
  min?: number;
  max?: number;
  size?: "sm" | "md";
};

export function QuantityControl({ quantity, onChange, min = 1, max = 99, size = "md" }: QuantityControlProps) {
  const compact = size === "sm";
  return (
    <div className={`inline-flex items-center rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800 ${compact ? "gap-1" : "gap-2"}`}>
      <button
        type="button"
        aria-label="Уменьшить количество"
        disabled={quantity <= min}
        className="grid size-11 place-items-center rounded-lg bg-white text-zinc-800 shadow-sm transition hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-700 dark:text-white"
        onClick={() => onChange(Math.max(min, quantity - 1))}
      >
        <Minus size={compact ? 14 : 16} />
      </button>
      <span className={`min-w-5 text-center font-bold text-zinc-950 dark:text-white ${compact ? "text-sm" : "text-base"}`}>{quantity}</span>
      <button
        type="button"
        aria-label="Увеличить количество"
        disabled={quantity >= max}
        className="grid size-11 place-items-center rounded-lg bg-white text-zinc-800 shadow-sm transition hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-700 dark:text-white"
        onClick={() => onChange(Math.min(max, quantity + 1))}
      >
        <Plus size={compact ? 14 : 16} />
      </button>
    </div>
  );
}
