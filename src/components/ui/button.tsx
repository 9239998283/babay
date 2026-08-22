import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
};

const variants = {
  primary: "bg-orange-500 text-white shadow-orange-500/25 hover:bg-orange-600 focus-visible:outline-orange-500",
  secondary: "bg-zinc-100 text-zinc-900 hover:bg-zinc-200 focus-visible:outline-zinc-900",
  ghost: "bg-transparent text-zinc-700 hover:bg-zinc-100 focus-visible:outline-zinc-900",
  danger: "bg-red-50 text-red-700 hover:bg-red-100 focus-visible:outline-red-600",
};

const sizes = { sm: "h-11 px-3 text-sm", md: "h-11 px-4 text-sm", lg: "h-12 px-5 text-base" };

export function Button({ children, className = "", variant = "primary", size = "md", type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
