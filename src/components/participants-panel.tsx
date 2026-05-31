"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LogOut, Shield, ShieldCheck, User } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Participant {
  id: string;
  userId: string;
  roomId: string;
  role: "owner" | "admin" | "member";
  joinedAt: string;
  user?: {
    name: string | null;
    image: string | null;
  };
}

interface ParticipantsPanelProps {
  roomId: string;
  currentUserId: string;
}

export function ParticipantsPanel({ roomId, currentUserId }: ParticipantsPanelProps) {
  const queryClient = useQueryClient();

  const { data: participants = [] } = useQuery({
    queryKey: ["participants", roomId],
    queryFn: async (): Promise<Participant[]> => {
      const res = await fetch(`/api/participants?roomId=${roomId}`);
      if (!res.ok) return [];
      return res.json();
    },
    refetchInterval: 5000,
  });

  const manageParticipant = useMutation({
    mutationFn: async (payload: { targetUserId: string; action: string; role?: string }) => {
      const res = await fetch("/api/rooms/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, ...payload }),
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["participants", roomId] });
    },
  });

  const handleKick = (targetUserId: string) => {
    if (!confirm("Kick this participant?")) return;
    manageParticipant.mutate({ targetUserId, action: "kick" });
  };

  const handleSetRole = (targetUserId: string, role: "admin" | "member") => {
    manageParticipant.mutate({ targetUserId, action: "setRole", role });
  };

  const currentParticipant = participants.find((p) => p.userId === currentUserId);
  const canManage = currentParticipant?.role === "owner" || currentParticipant?.role === "admin";

  const roleIcon = (role: string) => {
    switch (role) {
      case "owner":
        return <ShieldCheck className="w-4 h-4 text-amber-500" />;
      case "admin":
        return <Shield className="w-4 h-4 text-blue-500" />;
      default:
        return <User className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="p-4">
      <h3 className="text-sm font-semibold text-muted-foreground mb-3">
        Participants ({participants.length})
      </h3>
      <div className="space-y-2">
        {participants.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-accent"
          >
            <div className="flex items-center gap-2">
              {roleIcon(p.role)}
              <span className="text-sm">{p.user?.name || "Anonymous"}</span>
              {p.userId === currentUserId && (
                <span className="text-xs text-muted-foreground">(you)</span>
              )}
            </div>

            {canManage && p.userId !== currentUserId && p.role !== "owner" && (
              <div className="flex gap-1">
                {p.role === "member" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs text-blue-500"
                    onClick={() => handleSetRole(p.userId, "admin")}
                  >
                    Make Admin
                  </Button>
                )}
                {p.role === "admin" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs text-muted-foreground"
                    onClick={() => handleSetRole(p.userId, "member")}
                  >
                    Remove Admin
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-destructive"
                  onClick={() => handleKick(p.userId)}
                >
                  <LogOut className="w-3 h-3" />
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
