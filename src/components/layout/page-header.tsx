type PageHeaderProps = {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
};

export function PageHeader({ title, subtitle, right }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between px-5 pt-6 pb-4">
      <div>
        {subtitle && (
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-slate-400">
            {subtitle}
          </p>
        )}
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
      </div>
      {right && <div className="ml-4 mt-1">{right}</div>}
    </div>
  );
}
