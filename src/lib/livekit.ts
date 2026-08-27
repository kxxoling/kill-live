import { AccessToken } from "livekit-server-sdk";
import { env } from "@/lib/env";

export async function createLiveKitToken(
  roomName: string,
  participantName: string,
  participantIdentity: string,
): Promise<string> {
  const apiKey = env.LIVEKIT_API_KEY;
  const apiSecret = env.LIVEKIT_API_SECRET;

  const at = new AccessToken(apiKey, apiSecret, {
    identity: participantIdentity,
    name: participantName,
    ttl: 2 * 60 * 60, // 2 hours; re-issued on reconnect
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
  return env.LIVEKIT_URL;
}
