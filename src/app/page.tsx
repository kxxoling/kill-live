"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { usePasswordRoom } from "@/app/use-password-room";
import { CreateRoomDialog } from "@/components/create-room-dialog";
import { Header } from "@/components/header";
import { PasswordDialog } from "@/components/password-dialog";
import { RoomList } from "@/components/room-list";
import { SetUsernameDialog } from "@/components/set-username-dialog";
import { SignInDialog } from "@/components/sign-in-dialog";
import { signOut, useSession } from "@/lib/auth-client";
import { useRooms } from "@/queries/use-rooms";
import { useUpdateProfile } from "@/queries/use-user";

export default function Home() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const { data: rooms } = useRooms();
  const updateProfile = useUpdateProfile();
  const {
    passwordRoom,
    passwordError,
    passwordLoading,
    openPasswordDialog,
    closePasswordDialog,
    savePasswordAndNavigate,
  } = usePasswordRoom();

  const [showSignInDialog, setShowSignInDialog] = useState(false);
  const [showCreateRoomDialog, setShowCreateRoomDialog] = useState(false);
  const [usernameDismissed, setUsernameDismissed] = useState(false);

  const showUsernameDialog = !isPending && !!session && !session.user.name && !usernameDismissed;

  const handleSetUsername = async (name: string) => {
    await updateProfile.mutateAsync({ name });
    window.location.reload();
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.refresh();
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const handleSelectRoom = (roomId: string, hasPassword: boolean) => {
    if (hasPassword) {
      const room = rooms?.find((r) => r.id === roomId);
      openPasswordDialog(roomId, room?.name ?? "Room");
    } else {
      router.push(`/room/${roomId}`);
    }
  };

  const handlePasswordSubmit = (password: string) => {
    const roomId = savePasswordAndNavigate(password);
    if (roomId) router.push(`/room/${roomId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        session={session}
        onSignInClick={() => setShowSignInDialog(true)}
        onCreateRoomClick={() => setShowCreateRoomDialog(true)}
        onSignOut={handleSignOut}
      />

      <main className="container mx-auto py-6 px-4">
        <RoomList onSelectRoom={handleSelectRoom} />
      </main>

      <SignInDialog open={showSignInDialog} onOpenChange={setShowSignInDialog} showGuestOption />

      <CreateRoomDialog open={showCreateRoomDialog} onOpenChange={setShowCreateRoomDialog} />

      <SetUsernameDialog
        open={showUsernameDialog}
        onOpenChange={(open) => {
          if (!open) setUsernameDismissed(true);
        }}
        onSubmit={handleSetUsername}
        onSignInClick={() => {
          setUsernameDismissed(true);
          setTimeout(() => setShowSignInDialog(true), 100);
        }}
      />

      {passwordRoom && (
        <PasswordDialog
          open
          onOpenChange={(open) => !open && closePasswordDialog()}
          onSubmit={handlePasswordSubmit}
          roomName={passwordRoom.name}
          loading={passwordLoading}
          error={passwordError}
        />
      )}
    </div>
  );
}
