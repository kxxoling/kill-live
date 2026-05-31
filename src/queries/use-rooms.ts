import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type CreateRoomInput, createRoomSchema, type Room, roomListSchema } from "@/lib/schemas";

export function useRooms() {
  return useQuery({
    queryKey: ["rooms"],
    queryFn: async (): Promise<Room[]> => {
      const res = await fetch("/api/rooms");
      if (!res.ok) throw new Error("Failed to fetch rooms");
      const data = await res.json();
      return roomListSchema.parse(data);
    },
    refetchInterval: 5000,
  });
}

export function useCreateRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateRoomInput) => {
      createRoomSchema.parse(input);
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create room");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
  });
}
