"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ROOM_PASSWORD_STORAGE_KEY } from "@/lib/room-types";
import { type CreateRoomInput, createRoomSchema } from "@/lib/schemas";
import { useCreateRoom } from "@/queries/use-rooms";

interface CreateRoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateRoomDialog({ open, onOpenChange }: CreateRoomDialogProps) {
  const router = useRouter();
  const createRoom = useCreateRoom();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateRoomInput>({
    resolver: zodResolver(createRoomSchema),
    defaultValues: { name: "", description: "", password: "" },
  });

  const handleClose = () => {
    onOpenChange(false);
    reset();
  };

  const onSubmit = async (data: CreateRoomInput) => {
    try {
      const room = await createRoom.mutateAsync({
        ...data,
        password: data.password || undefined,
        config: { maxParticipants: 50, enableChat: true, enableVideo: true, enableAudio: true },
      });
      if (data.password) {
        sessionStorage.setItem(ROOM_PASSWORD_STORAGE_KEY(room.id), data.password);
      }
      handleClose();
      router.push(`/room/${room.id}`);
    } catch {
      // error is in createRoom.error
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={handleClose} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Room</DialogTitle>
          <DialogDescription>Set up a new space for your meeting or chat.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Room Name
            </label>
            <Input id="name" placeholder="e.g., Weekly Sync" {...register("name")} />
            {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description (Optional)
            </label>
            <Input
              id="description"
              placeholder="What's this room for?"
              {...register("description")}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password (Optional)
            </label>
            <Input
              id="password"
              placeholder="Leave empty for no password"
              type="password"
              {...register("password")}
            />
            {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
          </div>

          {createRoom.error && (
            <p className="text-sm text-red-500 font-medium">{createRoom.error.message}</p>
          )}

          <Button type="submit" disabled={createRoom.isPending} className="w-full">
            {createRoom.isPending ? "Creating..." : "Create Room"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
