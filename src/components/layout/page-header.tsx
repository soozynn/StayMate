type PageHeaderProps = {
  title: string;
  subtitle?: string;
};

export function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <div className="px-5 pt-6 pb-4">
      {subtitle && (
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-slate-400">
          {subtitle}
        </p>
      )}
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
    </div>
  );
}
