export type RoomConfig = {
  maxParticipants?: number;
  enableChat?: boolean;
  enableVideo?: boolean;
  enableAudio?: boolean;
};

export const DEFAULT_ROOM_CONFIG: RoomConfig = {
  maxParticipants: 50,
  enableChat: true,
  enableVideo: true,
  enableAudio: true,
};

export function normalizeRoomConfig(config: RoomConfig | null | undefined): RoomConfig {
  return { ...DEFAULT_ROOM_CONFIG, ...config };
}

export const ROOM_PASSWORD_STORAGE_KEY = (roomId: string) => `kill-live:room-pw:${roomId}`;
