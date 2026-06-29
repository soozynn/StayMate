type ReservationStatus = "pending" | "approved" | "rejected" | "cancelled";

const statusConfig: Record<
  ReservationStatus,
  { label: string; className: string }
> = {
  pending: {
    label: "승인 대기",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  approved: {
    label: "예약 확정",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  rejected: {
    label: "거절됨",
    className: "bg-red-50 text-red-600 border-red-200",
  },
  cancelled: {
    label: "취소됨",
    className: "bg-slate-50 text-slate-500 border-slate-200",
  },
};

type StatusBadgeProps = {
  status: ReservationStatus;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const { label, className } = statusConfig[status];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  );
}
