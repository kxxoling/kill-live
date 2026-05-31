"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
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
import { Separator } from "@/components/ui/separator";

const usernameSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50),
});

type UsernameForm = z.infer<typeof usernameSchema>;

interface SetUsernameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string) => Promise<void>;
  onSignInClick?: () => void;
}

export function SetUsernameDialog({
  open,
  onOpenChange,
  onSubmit,
  onSignInClick,
}: SetUsernameDialogProps) {
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UsernameForm>({
    resolver: zodResolver(usernameSchema),
    defaultValues: {
      name: "",
    },
  });

  const handleClose = () => onOpenChange(false);

  const handleFormSubmit = async (data: UsernameForm) => {
    setLoading(true);
    try {
      await onSubmit(data.name);
      handleClose();
    } catch (error) {
      console.error("Failed to set username:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={handleClose} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Welcome to Kill Live!</DialogTitle>
          <DialogDescription>Continue as a guest or sign in to your account</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-3">
            <div>
              <label htmlFor="guest-name" className="text-sm font-medium">
                Continue as Guest
              </label>
              <p className="text-xs text-muted-foreground mb-2">
                Enter a nickname to start using the app
              </p>
              <Input
                id="guest-name"
                {...register("name")}
                placeholder="Your nickname"
                className="w-full"
              />
              {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>}
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Saving..." : "Continue as Guest"}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <Button variant="outline" className="w-full" onClick={() => onSignInClick?.()}>
            Sign In / Register
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
