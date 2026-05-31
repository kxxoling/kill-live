import { useMutation } from "@tanstack/react-query";

export function useLiveKitToken() {
  return useMutation({
    mutationFn: async (roomName: string) => {
      const response = await fetch("/api/livekit/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomName }),
      });
      const data = await response.json();
      return (data.token || "") as string;
    },
  });
}
