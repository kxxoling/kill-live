"use client";

import { AudioWaveform, Lock, MessageSquare, Users, Video } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Room } from "@/lib/schemas";
import { useRooms } from "@/queries/use-rooms";

interface RoomListProps {
  onSelectRoom: (roomId: string, hasPassword: boolean) => void;
}

function RoomCard({ room, onSelect }: { room: Room; onSelect: () => void }) {
  return (
    <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={onSelect}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg font-bold">{room.name}</CardTitle>
            {room.hasPassword && <Lock className="w-4 h-4 text-amber-500" />}
          </div>
          <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400 font-medium">
            <Users className="w-4 h-4" />
            <span className={room.participantCount > 0 ? "text-green-500" : ""}>
              {room.participantCount}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-2 min-h-[2.5rem]">
          {room.description || "No description provided."}
        </p>
        <div className="flex flex-wrap gap-3">
          {room.config?.enableVideo && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
              <Video className="w-3.5 h-3.5" />
              <span>Video</span>
            </div>
          )}
          {room.config?.enableAudio && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
              <AudioWaveform className="w-3.5 h-3.5" />
              <span>Audio</span>
            </div>
          )}
          {room.config?.enableChat && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Chat</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function RoomListSkeleton() {
  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Card key={`skeleton-${i}`}>
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function RoomList({ onSelectRoom }: RoomListProps) {
  const { data: rooms, isLoading } = useRooms();

  if (isLoading) {
    return <RoomListSkeleton />;
  }

  if (!rooms || rooms.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No rooms available</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {rooms.map((room) => (
        <RoomCard
          key={room.id}
          room={room}
          onSelect={() => onSelectRoom(room.id, room.hasPassword)}
        />
      ))}
    </div>
  );
}
