import { AccessToken } from "livekit-server-sdk";

export async function createLiveKitToken(
  roomName: string,
  participantName: string,
  participantIdentity: string,
): Promise<string> {
  const apiKey = process.env.LIVEKIT_API_KEY!;
  const apiSecret = process.env.LIVEKIT_API_SECRET!;

  const at = new AccessToken(apiKey, apiSecret, {
    identity: participantIdentity,
    name: participantName,
  });

  at.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });

  return await at.toJwt();
}

export function getLiveKitUrl(): string {
  return process.env.LIVEKIT_URL!;
}
