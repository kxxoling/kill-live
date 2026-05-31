"use client";

import { AlertTriangle, ArrowLeft, Lock, Trash2, Unlock, Users, Video } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useAdminCleanup,
  useAdminDeleteRoom,
  useAdminDeleteUser,
  useAdminRooms,
  useAdminSetRoomPassword,
  useAdminUsers,
} from "@/queries/use-admin";

interface AdminRoom {
  id: string;
  name: string;
  description: string | null;
  hasPassword: boolean;
  createdAt: string;
}

interface AdminUser {
  id: string;
  name: string;
  email: string | null;
  username: string | null;
  createdAt: string;
}

function RoomPasswordButton({
  roomId,
  hasPassword,
  onToggle,
}: {
  roomId: string;
  hasPassword: boolean;
  onToggle: (roomId: string, hasPassword: boolean) => void;
}) {
  return (
    <Button variant="outline" size="sm" onClick={() => onToggle(roomId, hasPassword)}>
      {hasPassword ? (
        <>
          <Unlock className="w-4 h-4 mr-1" />
          Remove Password
        </>
      ) : (
        <>
          <Lock className="w-4 h-4 mr-1" />
          Set Password
        </>
      )}
    </Button>
  );
}

function DeleteButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <Button variant="destructive" size="sm" onClick={onClick} aria-label={label}>
      <Trash2 className="w-4 h-4" />
    </Button>
  );
}

export default function AdminPage() {
  const { data: rooms = [], isLoading: roomsLoading } = useAdminRooms();
  const { data: users = [], isLoading: usersLoading } = useAdminUsers();
  const deleteRoom = useAdminDeleteRoom();
  const deleteUser = useAdminDeleteUser();
  const setRoomPassword = useAdminSetRoomPassword();
  const cleanup = useAdminCleanup();
  const loading = roomsLoading || usersLoading;

  const handleDeleteRoom = (roomId: string) => {
    if (!confirm("Are you sure you want to delete this room?")) return;
    deleteRoom.mutate(roomId);
  };

  const handleDeleteUser = (userId: string) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone."))
      return;
    deleteUser.mutate(userId);
  };

  const handleTogglePassword = (roomId: string, currentHasPassword: boolean) => {
    if (currentHasPassword) {
      if (!confirm("Remove password from this room?")) return;
      setRoomPassword.mutate({ id: roomId, password: null });
    } else {
      const newPassword = prompt("Enter new password for this room (min 6 chars):");
      if (!newPassword) return;
      if (newPassword.length < 6) {
        alert("Password must be at least 6 characters");
        return;
      }
      setRoomPassword.mutate({ id: roomId, password: newPassword });
    }
  };

  const handleCleanup = () => {
    if (!confirm("This will mark all active participants as having left. Continue?")) return;
    cleanup.mutate(undefined, {
      onSuccess: (data) => {
        alert(`Cleaned up ${data.updated} stale participant records`);
      },
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>

        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Warning:</strong> This admin panel has no authentication. Anyone with access
                to this URL can manage rooms and users. In production, add proper authentication.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <Button onClick={handleCleanup} variant="outline" size="sm">
            <Users className="w-4 h-4 mr-2" />
            Cleanup Participants
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <Tabs defaultValue="rooms">
            <TabsList>
              <TabsTrigger value="rooms">
                <Video className="w-4 h-4 mr-2" />
                Rooms ({rooms.length})
              </TabsTrigger>
              <TabsTrigger value="users">
                <Users className="w-4 h-4 mr-2" />
                Users ({users.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="rooms">
              <div className="space-y-4 mt-4">
                {rooms.map((room: AdminRoom) => (
                  <Card key={room.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{room.name}</h3>
                            {room.hasPassword && (
                              <span className="px-2 py-0.5 text-xs bg-orange-100 text-orange-800 rounded flex items-center gap-1">
                                <Lock className="w-3 h-3" />
                                Protected
                              </span>
                            )}
                          </div>
                          {room.description && (
                            <p className="text-sm text-muted-foreground mt-1">{room.description}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            Created: {new Date(room.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <RoomPasswordButton
                            roomId={room.id}
                            hasPassword={room.hasPassword}
                            onToggle={handleTogglePassword}
                          />
                          <DeleteButton
                            onClick={() => handleDeleteRoom(room.id)}
                            label="Delete room"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="users">
              <div className="space-y-4 mt-4">
                {users.map((user: AdminUser) => (
                  <Card key={user.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{user.name}</h3>
                            {user.username && (
                              <span className="text-sm text-muted-foreground">
                                @{user.username}
                              </span>
                            )}
                          </div>
                          {user.email && (
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            Joined: {new Date(user.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <DeleteButton
                          onClick={() => handleDeleteUser(user.id)}
                          label="Delete user"
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
