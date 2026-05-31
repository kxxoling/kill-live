"use client";

import { ArrowLeft, MessageSquare, Users, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ChatSidebar } from "@/components/chat-sidebar";
import { LiveKitRoomComponent } from "@/components/livekit-room";
import { ParticipantsPanel } from "@/components/participants-panel";
import { PasswordDialog } from "@/components/password-dialog";
import { SetUsernameDialog } from "@/components/set-username-dialog";
import { SignInDialog } from "@/components/sign-in-dialog";
import { Button } from "@/components/ui/button";
import { signIn, useSession } from "@/lib/auth-client";
import { joinRoomClient, leaveRoomClient, type RoomJoinStatus } from "@/lib/room-client";
import { normalizeRoomConfig, ROOM_PASSWORD_STORAGE_KEY, type RoomConfig } from "@/lib/room-types";

function subscribeMobile(cb: () => void) {
  const mq = window.matchMedia("(max-width: 767px)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

function getMobileSnapshot() {
  return window.matchMedia("(max-width: 767px)").matches;
}

interface RoomContentProps {
  roomId: string;
  roomName: string;
  livekitUrl: string;
  hasPassword: boolean;
  roomConfig: RoomConfig | null;
  enableUpload?: boolean;
}

export function RoomContent({
  roomId,
  roomName,
  livekitUrl,
  hasPassword,
  roomConfig,
  enableUpload = false,
}: RoomContentProps) {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const config = normalizeRoomConfig(roomConfig);
  const [chatOpen, setChatOpen] = useState(config.enableChat !== false);
  const [peopleOpen, setPeopleOpen] = useState(false);
  const isMobile = useSyncExternalStore(subscribeMobile, getMobileSnapshot, () => false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [status, setStatus] = useState<RoomJoinStatus>("idle");
  const [joinError, setJoinError] = useState("");
  const [showSignInDialog, setShowSignInDialog] = useState(false);
  const joinedRef = useRef(false);

  const leave = useCallback(() => {
    if (!joinedRef.current) return;
    joinedRef.current = false;
    void leaveRoomClient(roomId);
  }, [roomId]);

  const needsGuest = !isPending && !session;

  useEffect(() => {
    const userId = session?.user.id;
    if (!userId) return;

    let cancelled = false;

    void (async () => {
      const result = await joinRoomClient(roomId);
      if (cancelled) return;
      if (result.ok) {
        joinedRef.current = true;
      }
      setStatus(result.status);
      setJoinError(result.error);
    })();

    return () => {
      cancelled = true;
    };
  }, [session?.user.id, roomId]);

  useEffect(() => {
    if (status !== "joined") return;
    const onLeave = () => leave();
    window.addEventListener("beforeunload", onLeave);
    return () => {
      window.removeEventListener("beforeunload", onLeave);
      leave();
    };
  }, [status, leave]);

  const handleSetUsername = async (name: string) => {
    try {
      await signIn.anonymous();
      const response = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!response.ok) throw new Error("Failed to update username");
    } catch (error) {
      console.error("Failed to join anonymously:", error);
    }
  };

  const handleBack = () => {
    leave();
    router.push("/");
  };

  const handlePasswordSubmit = async (password: string) => {
    setPasswordLoading(true);
    sessionStorage.setItem(ROOM_PASSWORD_STORAGE_KEY(roomId), password);
    setStatus("joining");
    const result = await joinRoomClient(roomId, password);
    if (result.ok) {
      joinedRef.current = true;
    }
    setStatus(result.status);
    setJoinError(result.error);
    setPasswordLoading(false);
  };

  const isJoining = !!session?.user.id && (status === "idle" || status === "joining");

  if (isPending || isJoining) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <SetUsernameDialog
          open={needsGuest && !showSignInDialog}
          onOpenChange={(open) => {
            if (!open) router.push("/");
          }}
          onSubmit={handleSetUsername}
          onSignInClick={() => setShowSignInDialog(true)}
        />
        <SignInDialog open={showSignInDialog} onOpenChange={setShowSignInDialog} showGuestOption />
        <div className="text-center">
          <p className="mb-4 text-muted-foreground">Set a nickname to join as guest</p>
          <Button
            onClick={() => router.push("/")}
            variant="ghost"
            className="text-muted-foreground"
          >
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  if (status === "password") {
    return (
      <PasswordDialog
        open
        onOpenChange={(open) => !open && handleBack()}
        onSubmit={handlePasswordSubmit}
        roomName={roomName}
        loading={passwordLoading}
        error={joinError}
      />
    );
  }

  if (status === "full" || status === "error") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-4 px-4">
        <p className="text-destructive text-center">{joinError}</p>
        <Button onClick={handleBack} variant="outline">
          Back to Home
        </Button>
      </div>
    );
  }

  const showChat = config.enableChat !== false;
  const showVideo = config.enableVideo !== false;
  const showAudio = config.enableAudio !== false;
  const sidebarOpen = (showChat && chatOpen) || peopleOpen;

  const chatPanel = showChat ? (
    <ChatSidebar roomId={roomId} userId={session.user.id} enableUpload={enableUpload} />
  ) : null;

  const peoplePanel = <ParticipantsPanel roomId={roomId} currentUserId={session.user.id} />;

  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      <header className="bg-card border-b px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="text-muted-foreground hover:text-foreground px-2"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Back</span>
            </Button>
            <div className="h-4 w-[1px] bg-border hidden sm:block" />
            <span className="text-sm font-semibold truncate max-w-[150px] sm:max-w-none">
              {roomName}
              {hasPassword && " 🔒"}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {session && !session.user.isAnonymous && (
              <span className="text-xs text-muted-foreground font-medium hidden sm:inline">
                {session.user.name}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPeopleOpen(!peopleOpen)}
              className={`h-8 text-xs ${peopleOpen ? "bg-accent" : ""}`}
            >
              <Users className="w-4 h-4 sm:mr-1" />
              <span className="hidden sm:inline">People</span>
            </Button>
            {showChat && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setChatOpen(!chatOpen)}
                className={`h-8 text-xs ${chatOpen ? "bg-accent" : ""}`}
              >
                <MessageSquare className="w-4 h-4 sm:mr-1" />
                <span className="hidden sm:inline">{chatOpen ? "Hide Chat" : "Chat"}</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 bg-black">
          <LiveKitRoomComponent
            roomName={roomId}
            serverUrl={livekitUrl}
            enableVideo={showVideo}
            enableAudio={showAudio}
            enableScreenShare={showVideo}
          />
        </div>

        {!isMobile && sidebarOpen && (
          <div className="w-80 border-l border-border bg-card flex flex-col overflow-hidden">
            {showChat && chatOpen && (
              <div
                className={peopleOpen ? "flex-1 min-h-0 border-b border-border" : "flex-1 min-h-0"}
              >
                {chatPanel}
              </div>
            )}
            {peopleOpen && (
              <div
                className={
                  showChat && chatOpen ? "max-h-[40%] overflow-y-auto" : "flex-1 overflow-y-auto"
                }
              >
                {peoplePanel}
              </div>
            )}
          </div>
        )}

        {isMobile && showChat && chatOpen && (
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-card border-t border-border z-50 flex flex-col">
            <div className="flex items-center justify-between px-4 py-2 border-b border-border">
              <span className="text-sm font-medium text-muted-foreground">Chat</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setChatOpen(false)}
                className="h-7 w-7 p-0 text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-hidden">{chatPanel}</div>
          </div>
        )}

        {isMobile && peopleOpen && (
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-card border-t border-border z-40 overflow-y-auto">
            {peoplePanel}
          </div>
        )}
      </div>

      <SetUsernameDialog
        open={!!session && !session.user.name}
        onOpenChange={() => {}}
        onSubmit={handleSetUsername}
      />
    </div>
  );
}
