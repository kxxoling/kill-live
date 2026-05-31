import { useCallback, useState } from "react";
import { ROOM_PASSWORD_STORAGE_KEY } from "@/lib/room-types";

export function usePasswordRoom() {
  const [passwordRoom, setPasswordRoom] = useState<{ id: string; name: string } | null>(null);
  const [passwordError, setPasswordError] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  const openPasswordDialog = useCallback((id: string, name: string) => {
    setPasswordRoom({ id, name });
    setPasswordError("");
  }, []);

  const closePasswordDialog = useCallback(() => {
    setPasswordRoom(null);
    setPasswordError("");
  }, []);

  const savePasswordAndNavigate = useCallback(
    (password: string) => {
      if (!passwordRoom?.id) return;
      setPasswordLoading(true);
      try {
        sessionStorage.setItem(ROOM_PASSWORD_STORAGE_KEY(passwordRoom.id), password);
        const roomId = passwordRoom.id;
        closePasswordDialog();
        return roomId;
      } catch {
        setPasswordError("Failed to join room");
        return null;
      } finally {
        setPasswordLoading(false);
      }
    },
    [passwordRoom, closePasswordDialog],
  );

  return {
    passwordRoom,
    passwordError,
    passwordLoading,
    openPasswordDialog,
    closePasswordDialog,
    setPasswordError,
    setPasswordLoading,
    savePasswordAndNavigate,
  };
}
