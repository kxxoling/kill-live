import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useAdminRooms() {
  return useQuery({
    queryKey: ["admin-rooms"],
    queryFn: async () => {
      const res = await fetch("/api/admin/rooms");
      if (!res.ok) throw new Error("Failed to fetch rooms");
      return res.json();
    },
  });
}

export function useAdminUsers() {
  return useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
  });
}

export function useAdminDeleteRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/rooms?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to delete room");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-rooms"] });
    },
  });
}

export function useAdminDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/users?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to delete user");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });
}

export function useAdminSetRoomPassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, password }: { id: string; password: string | null }) => {
      const res = await fetch("/api/admin/rooms", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, password }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to update password");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-rooms"] });
    },
  });
}

export function useAdminCleanup() {
  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/cleanup", { method: "POST" });
      if (!res.ok) throw new Error("Failed to cleanup");
      return res.json();
    },
  });
}
