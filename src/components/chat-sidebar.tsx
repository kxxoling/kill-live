"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Paperclip, Send } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatFileSize } from "@/lib/utils";

interface Message {
  id: string;
  content: string;
  type?: "text" | "image" | "file" | "system";
  fileUrl?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  userId: string;
  roomId: string;
  createdAt: string;
  user?: {
    name: string | null;
    image: string | null;
  };
}

interface ChatSidebarProps {
  roomId: string;
  userId: string;
  enableUpload?: boolean;
}

export function ChatSidebar({ roomId, userId, enableUpload = false }: ChatSidebarProps) {
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["messages", roomId],
    queryFn: async (): Promise<Message[]> => {
      const res = await fetch(`/api/messages?roomId=${roomId}`);
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    refetchInterval: 2000,
  });

  const sendMessage = useMutation({
    mutationFn: async (payload: {
      content: string;
      roomId: string;
      type?: string;
      fileUrl?: string;
      fileName?: string;
      fileSize?: number;
    }) => {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData<Message[]>(["messages", roomId], (old = []) => [...old, data]);
    },
  });

  const uploadFile = useMutation({
    mutationFn: async ({ file, type }: { file: File; type: "image" | "file" }) => {
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
      if (!uploadRes.ok) throw new Error("Upload failed");
      const { url, name, size } = await uploadRes.json();

      return sendMessage.mutateAsync({
        content: type === "image" ? `📷 ${name}` : `📎 ${name}`,
        roomId,
        type,
        fileUrl: url,
        fileName: name,
        fileSize: size,
      });
    },
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    const msg = newMessage;
    setNewMessage("");
    sendMessage.mutate({ content: msg, roomId });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "file") => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadFile.mutate({ file, type });
    e.target.value = "";
  };

  const uploading = uploadFile.isPending;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-muted/50">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm">
            No messages yet. Start the conversation!
          </p>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.userId === userId ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 ${
                  message.userId === userId
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border text-card-foreground"
                }`}
              >
                <p
                  className={`text-[10px] font-semibold mb-0.5 truncate ${
                    message.userId === userId
                      ? "text-primary-foreground/70"
                      : "text-muted-foreground"
                  }`}
                >
                  {message.user?.name || "Anonymous"}
                </p>

                {message.type === "image" && message.fileUrl && (
                  <a href={message.fileUrl} target="_blank" rel="noopener noreferrer">
                    <Image
                      src={message.fileUrl}
                      alt={message.fileName || "Image"}
                      width={300}
                      height={200}
                      className="max-w-full rounded mb-1 max-h-48 object-cover"
                      unoptimized
                    />
                  </a>
                )}

                {message.type === "file" && message.fileUrl && (
                  <a
                    href={message.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-sm underline ${
                      message.userId === userId ? "text-primary-foreground/80" : "text-primary"
                    }`}
                  >
                    📎 {message.fileName || "File"}
                    {message.fileSize && (
                      <span className="text-xs opacity-70 ml-1">
                        ({formatFileSize(message.fileSize)})
                      </span>
                    )}
                  </a>
                )}

                <p className="text-sm leading-relaxed break-words">{message.content}</p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-border bg-card">
        <div className="flex gap-2">
          {enableUpload && (
            <>
              <input
                type="file"
                ref={imageInputRef}
                onChange={(e) => handleFileChange(e, "image")}
                accept="image/*"
                className="hidden"
              />
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => handleFileChange(e, "file")}
                className="hidden"
              />

              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="shrink-0 text-muted-foreground"
                onClick={() => imageInputRef.current?.click()}
                disabled={uploading}
              >
                <ImagePlus className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="shrink-0 text-muted-foreground"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Paperclip className="w-4 h-4" />
              </Button>
            </>
          )}

          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={uploading ? "Uploading..." : "Type a message..."}
            className="flex-1"
            disabled={uploading}
          />
          <Button
            type="submit"
            size="icon"
            className="bg-primary hover:bg-primary/90 shrink-0"
            disabled={!newMessage.trim() || uploading}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
