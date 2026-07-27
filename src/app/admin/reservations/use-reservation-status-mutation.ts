"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

export type AdminReservationAction = "approved" | "rejected" | "cancelled";

async function updateReservationStatus(
  id: string,
  status: AdminReservationAction,
  adminNote?: string,
) {
  const res = await fetch(`/api/admin/reservations/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, source: "admin", adminNote }),
  });
  if (!res.ok) throw new Error("Failed to update status");
  return res.json();
}

export function useReservationStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status,
      note,
    }: {
      id: string;
      status: AdminReservationAction;
      note?: string;
    }) => updateReservationStatus(id, status, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reservations"] });
      queryClient.invalidateQueries({ queryKey: ["admin-reservation"] });
    },
  });
}
