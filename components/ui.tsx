import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger" | "ghost"; size?: "sm" | "md" | "lg" }) {
  return (
    <button
      className={cn(
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-md border px-4 font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" && "border-unblue bg-unblue text-white hover:bg-blue-700",
        variant === "secondary" && "border-slate-200 bg-white text-ink hover:bg-mist dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100",
        variant === "danger" && "border-red-600 bg-red-600 text-white hover:bg-red-700",
        variant === "ghost" && "border-transparent bg-transparent text-ink hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800",
        size === "sm" && "min-h-9 px-3 text-sm",
        size === "lg" && "min-h-12 px-5 text-base",
        className
      )}
      {...props}
    />
  );
}

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <section className={cn("rounded-lg border border-slate-200 bg-white shadow-soft dark:border-slate-800 dark:bg-slate-900", className)} {...props} />;
}

export function Badge({ className, tone = "slate", ...props }: React.HTMLAttributes<HTMLSpanElement> & { tone?: "blue" | "green" | "amber" | "red" | "slate" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold",
        tone === "blue" && "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200",
        tone === "green" && "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
        tone === "amber" && "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200",
        tone === "red" && "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200",
        tone === "slate" && "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200",
        className
      )}
      {...props}
    />
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200">
      <span>{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  "min-h-11 rounded-md border border-slate-200 bg-white px-3 text-sm text-ink shadow-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100";
