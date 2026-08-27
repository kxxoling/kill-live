// Shared API fixtures for the e2e specs.
export const mockRooms = [
  {
    id: "general",
    name: "General Chat",
    description: "General discussion room for everyone",
    hasPassword: false,
    participantCount: 0,
    config: {
      enableChat: true,
      enableAudio: true,
      enableVideo: true,
      maxParticipants: 50,
    },
  },
  {
    id: "gaming",
    name: "Gaming",
    description: "Talk about your favorite games",
    hasPassword: false,
    participantCount: 3,
    config: {
      enableChat: true,
      enableAudio: true,
      enableVideo: true,
      maxParticipants: 30,
    },
  },
];

export const mockAdminRooms = [
  {
    id: "1",
    name: "Room 1",
    description: null,
    hasPassword: false,
    createdAt: new Date().toISOString(),
  },
];
