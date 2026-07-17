import { cn } from "@/components/ui";

export function BrandLogo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <div className={cn("flex items-center rounded-md border border-slate-300 bg-white shadow-md", compact ? "h-16 w-52 px-3" : "h-20 w-64 px-4", className)}>
      <img src="/rc73-logo.png" alt="RC73" className="h-full w-full object-contain" />
    </div>
  );
}

export function WhoLogo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <div className={cn("flex items-center rounded-md border border-slate-300 bg-white shadow-md", compact ? "h-16 w-36 px-3" : "h-20 w-48 px-4", className)}>
      <img src="/who-emro-logo.png" alt="World Health Organization Eastern Mediterranean Region" className="h-full w-full object-contain" />
    </div>
  );
}
