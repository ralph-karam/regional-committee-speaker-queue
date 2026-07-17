import { cn } from "@/components/ui";

export function BrandLogo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <div className={cn("flex items-center rounded-md border border-slate-200 bg-white shadow-sm", compact ? "h-12 w-36 px-2" : "h-16 w-52 px-3", className)}>
      <img src="/rc73-logo.png" alt="RC73" className="h-full w-full object-contain" />
    </div>
  );
}

export function WhoLogo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <div className={cn("flex items-center rounded-md border border-slate-200 bg-white shadow-sm", compact ? "h-12 w-24 px-2" : "h-16 w-40 px-3", className)}>
      <img src="/who-emro-logo.png" alt="World Health Organization Eastern Mediterranean Region" className="h-full w-full object-contain" />
    </div>
  );
}
