import { z } from "zod";

const roomConfigSchema = z.object({
  maxParticipants: z.number().min(1).max(500).optional(),
  enableChat: z.boolean().optional(),
  enableVideo: z.boolean().optional(),
  enableAudio: z.boolean().optional(),
});

export const createRoomSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50),
  description: z.string().max(200).optional(),
  password: z.string().min(4, "Password must be at least 4 characters").optional(),
  config: roomConfigSchema.optional(),
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;

export const usernameSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50),
});

export const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30)
    .regex(/^[a-zA-Z0-9_-]+$/, "Only letters, numbers, _ and - allowed")
    .optional()
    .or(z.literal("")),
});

export type ProfileInput = z.infer<typeof profileSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const roomSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  hasPassword: z.boolean(),
  participantCount: z.coerce.number(),
  config: roomConfigSchema.nullable(),
});

export const roomListSchema = z.array(roomSchema);

export type Room = z.infer<typeof roomSchema>;
