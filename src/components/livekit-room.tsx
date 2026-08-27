"use client";

import {
  LiveKitRoom,
  RoomAudioRenderer,
  useConnectionState,
  useRoomContext,
  VideoConference,
} from "@livekit/components-react";
import { ConnectionState, RoomEvent, Track } from "livekit-client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useLiveKitToken } from "@/queries/use-livekit";
import "@livekit/components-styles";

interface LiveKitRoomComponentProps {
  roomName: string;
  serverUrl?: string;
  enableVideo?: boolean;
  enableAudio?: boolean;
  enableScreenShare?: boolean;
}

const MEDIA_PREFS_KEY = "kill-live:media-prefs";

type MediaPrefs = { audio: boolean; video: boolean };

function readMediaPrefs(): MediaPrefs | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(MEDIA_PREFS_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      typeof (parsed as MediaPrefs).audio === "boolean" &&
      typeof (parsed as MediaPrefs).video === "boolean"
    ) {
      return parsed as MediaPrefs;
    }
  } catch {
    // Corrupt stored prefs: fall back to defaults.
  }
  return null;
}

/** Persists the in-call mic/camera state whenever it changes. */
function MediaPrefSync() {
  const room = useRoomContext();

  useEffect(() => {
    if (!room) return;

    const save = () => {
      const camera = room.localParticipant.getTrackPublication(Track.Source.Camera);
      const microphone = room.localParticipant.getTrackPublication(Track.Source.Microphone);
      const prefs: MediaPrefs = {
        video: !!camera && !camera.isMuted,
        audio: !!microphone && !microphone.isMuted,
      };
      window.localStorage.setItem(MEDIA_PREFS_KEY, JSON.stringify(prefs));
    };

    room.on(RoomEvent.LocalTrackPublished, save);
    room.on(RoomEvent.LocalTrackUnpublished, save);
    room.on(RoomEvent.TrackMuted, save);
    room.on(RoomEvent.TrackUnmuted, save);
    return () => {
      room.off(RoomEvent.LocalTrackPublished, save);
      room.off(RoomEvent.LocalTrackUnpublished, save);
      room.off(RoomEvent.TrackMuted, save);
      room.off(RoomEvent.TrackUnmuted, save);
    };
  }, [room]);

  return null;
}

function ConnectingPlaceholder() {
  return (
    <div className="flex items-center justify-center h-full bg-black">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white" />
    </div>
  );
}

function ConnectionAwareContent({ children }: { children: React.ReactNode }) {
  const connectionState = useConnectionState();

  if (connectionState === ConnectionState.Connecting) {
    return <ConnectingPlaceholder />;
  }

  return <>{children}</>;
}

export function LiveKitRoomComponent({
  roomName,
  serverUrl,
  enableVideo = true,
  enableAudio = true,
}: LiveKitRoomComponentProps) {
  const [disconnected, setDisconnected] = useState(false);
  const finalServerUrl = serverUrl || process.env.NEXT_PUBLIC_LIVEKIT_URL;

  // Stored prefs are what the user last chose in a call and always win;
  // the room config only provides the default for first-time visitors.
  const [media] = useState(() => {
    const prefs = readMediaPrefs();
    return prefs ?? { audio: enableAudio, video: enableVideo };
  });

  const { mutate: fetchToken, data: token, isPending, isError } = useLiveKitToken();

  const handleReconnect = () => {
    setDisconnected(false);
    fetchToken(roomName);
  };

  useEffect(() => {
    fetchToken(roomName);
  }, [roomName, fetchToken]);

  if (isPending) {
    return <ConnectingPlaceholder />;
  }

  if (isError || !token) {
    return (
      <div className="flex items-center justify-center h-full bg-black">
        <p className="text-red-400">Failed to connect to room</p>
      </div>
    );
  }

  if (disconnected) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-black gap-4">
        <p className="text-white text-lg">You left the room</p>
        <Button onClick={handleReconnect} className="bg-white text-black hover:bg-white/90">
          Reconnect
        </Button>
      </div>
    );
  }

  return (
    <LiveKitRoom
      video={media.video}
      audio={media.audio}
      token={token}
      serverUrl={finalServerUrl}
      className="h-full relative"
      onDisconnected={() => setDisconnected(true)}
    >
      <style>{`
				.lk-chat-toggle, .lk-chat, .lk-chat-pane, .lk-chat-input, .lk-chat-messages {
					display: none !important;
				}
				.lk-room-container {
					--lk-bg: #0a0a0a;
					--lk-bg2: #1a1a1a;
					--lk-bg3: #2a2a2a;
					--lk-bg4: #3a3a3a;
					--lk-bg5: #4a4a4a;
					--lk-fg: #ffffff;
					--lk-fg2: #e5e5e5;
					--lk-border-color: #333;
					--lk-control-fg: #fff;
					--lk-control-bg: #1a1a1a;
					--lk-control-hover-bg: #2a2a2a;
					--lk-danger: #f91f31;
					--lk-danger-fg: #fff;
				}
			`}</style>
      <ConnectionAwareContent>
        <VideoConference />
        <RoomAudioRenderer />
      </ConnectionAwareContent>
      <MediaPrefSync />
    </LiveKitRoom>
  );
}
