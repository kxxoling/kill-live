"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const passwordSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

type PasswordForm = z.infer<typeof passwordSchema>;

interface PasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (password: string) => void;
  roomName: string;
  loading?: boolean;
  error?: string;
}

export function PasswordDialog({
  open,
  onOpenChange,
  onSubmit,
  roomName,
  loading,
  error,
}: PasswordDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  const handleFormSubmit = (data: PasswordForm) => {
    onSubmit(data.password);
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>🔒 Private Room</DialogTitle>
          <DialogDescription>&quot;{roomName}&quot; requires a password to join.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 py-4">
          <Input
            type="password"
            placeholder="Enter room password"
            autoFocus
            {...register("password")}
          />
          {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Joining..." : "Join Room"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
