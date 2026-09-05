import { Armchair } from "lucide-react";

interface AuthBrandHeaderProps {
  title: string;
  subtitle: string;
}

export function AuthBrandHeader({ title, subtitle }: AuthBrandHeaderProps) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-primary-200/60 bg-primary-600 text-white shadow-sm">
          <Armchair className="h-6 w-6" />
        </div>
        <div className="text-left">
          <span className="block text-2xl leading-tight font-bold tracking-tight text-text">
            Urban Furniture
          </span>
          <span className="text-xs font-medium tracking-wide text-text-muted uppercase">
            Accounting &amp; ERP
          </span>
        </div>
      </div>
      <h1 className="mt-6 text-2xl font-bold tracking-tight text-text">
        {title}
      </h1>
      <p className="mt-1.5 text-sm text-text-muted">{subtitle}</p>
    </div>
  );
}
