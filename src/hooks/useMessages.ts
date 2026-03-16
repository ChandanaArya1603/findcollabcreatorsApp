import { useState, useEffect, useCallback, useRef } from "react";
import { messageService } from "@/services/messageService";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";

/* ──────────────────── Types ──────────────────── */

export interface ChatUser {
  id: number;
  name: string;
  avatar?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isOnline: boolean;
}

export interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  message: string;
  createdAt: string;
  isOwn: boolean;
  attachment?: { name: string; type: string; url?: string };
}

/* ──────────────── Colour palette ─────────────── */

const AVATAR_COLORS = [
  "bg-pink-500",
  "bg-orange-500",
  "bg-rose-500",
  "bg-blue-500",
  "bg-yellow-500",
  "bg-green-500",
  "bg-violet-500",
  "bg-teal-500",
];

const colorForId = (id: number) => AVATAR_COLORS[id % AVATAR_COLORS.length];

/* ──────────────── Helpers ────────────────────── */

function formatTime(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return `${Math.floor(diffDays / 7)}w ago`;
  } catch {
    return dateStr;
  }
}

/** Map raw API chat-user to our UI shape */
function mapChatUser(raw: any): ChatUser {
  return {
    id: raw.id ?? raw.user_id ?? raw.receiver_id ?? 0,
    name: raw.name ?? raw.fname
      ? `${raw.fname ?? ""} ${raw.lname ?? ""}`.trim()
      : raw.brand_name ?? "Unknown",
    avatar: raw.avatar ?? raw.profile_pic ?? raw.profile_image ?? undefined,
    lastMessage: raw.last_message ?? raw.lastMessage ?? raw.message ?? "",
    lastMessageTime: raw.last_message_time ?? raw.updated_at ?? raw.created_at ?? "",
    unreadCount: Number(raw.unread_count ?? raw.unreadCount ?? 0),
    isOnline: Boolean(raw.is_online ?? raw.isOnline ?? false),
  };
}

/** Map raw API message to our UI shape */
function mapMessage(raw: any, currentUserId: number): Message {
  const senderId = Number(raw.sender_id ?? raw.senderId ?? raw.from_id ?? 0);
  return {
    id: raw.id ?? raw.message_id ?? 0,
    senderId,
    receiverId: Number(raw.receiver_id ?? raw.receiverId ?? raw.to_id ?? 0),
    message: raw.message ?? raw.text ?? raw.content ?? "",
    createdAt: raw.created_at ?? raw.createdAt ?? raw.time ?? "",
    isOwn: senderId === currentUserId,
    attachment: raw.attachment ?? raw.file
      ? {
          name: raw.attachment?.name ?? raw.file_name ?? raw.file?.name ?? "File",
          type: raw.attachment?.type ?? raw.file_type ?? raw.file?.type ?? "file",
          url: raw.attachment?.url ?? raw.file_url ?? raw.file?.url,
        }
      : undefined,
  };
}

/* ──────────────── Hook ───────────────────────── */

export function useMessages() {
  const { user } = useAuth();
  const currentUserId = user?.id ?? 0;

  const [chatUsers, setChatUsers] = useState<ChatUser[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* Fetch chat users */
  const fetchChatUsers = useCallback(async () => {
    try {
      setError(null);
      const res = await messageService.getChatUsers();
      const list = Array.isArray(res) ? res : res?.chat_users ?? res?.users ?? res?.data ?? [];
      setChatUsers(list.map(mapChatUser));
    } catch (err: any) {
      console.error("Failed to fetch chat users:", err);
      setError(err.message ?? "Failed to load conversations");
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  /* Fetch messages for a specific user */
  const fetchMessages = useCallback(
    async (receiverId: number) => {
      setLoadingMessages(true);
      setError(null);
      try {
        const res = await messageService.getMessages(receiverId);
        const list = Array.isArray(res) ? res : res?.messages ?? res?.data ?? [];
        setMessages(list.map((m: any) => mapMessage(m, currentUserId)));
      } catch (err: any) {
        console.error("Failed to fetch messages:", err);
        setError(err.message ?? "Failed to load messages");
      } finally {
        setLoadingMessages(false);
      }
    },
    [currentUserId]
  );

  /* Send a message */
  const sendMessage = useCallback(
    async (receiverId: number, text: string) => {
      if (!text.trim()) return;
      setSending(true);
      try {
        await messageService.sendMessage(receiverId, text);
        // Optimistically add the message
        const optimistic: Message = {
          id: Date.now(),
          senderId: currentUserId,
          receiverId,
          message: text,
          createdAt: new Date().toISOString(),
          isOwn: true,
        };
        setMessages((prev) => [...prev, optimistic]);
        // Refresh messages from server
        await fetchMessages(receiverId);
      } catch (err: any) {
        console.error("Failed to send message:", err);
        setError(err.message ?? "Failed to send message");
      } finally {
        setSending(false);
      }
    },
    [currentUserId, fetchMessages]
  );

  /* Fetch unread count */
  const fetchUnreadCount = useCallback(async (): Promise<number> => {
    try {
      const res = await messageService.getUnreadCount();
      return Number(res?.unread_count ?? res?.count ?? res ?? 0);
    } catch {
      return 0;
    }
  }, []);

  /* Load chat users on mount */
  useEffect(() => {
    fetchChatUsers();
  }, [fetchChatUsers]);

  /* Poll for new messages every 15s when viewing a chat */
  const startPolling = useCallback(
    (receiverId: number) => {
      stopPolling();
      pollRef.current = setInterval(() => {
        fetchMessages(receiverId);
      }, 15000);
    },
    [fetchMessages]
  );

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => () => stopPolling(), [stopPolling]);

  /* Derived helpers */
  const totalUnread = chatUsers.reduce((sum, u) => sum + u.unreadCount, 0);

  const getInitial = (name: string) => (name.charAt(0) || "?").toUpperCase();
  const getColor = (id: number) => colorForId(id);

  return {
    chatUsers,
    messages,
    loadingUsers,
    loadingMessages,
    sending,
    error,
    totalUnread,
    fetchChatUsers,
    fetchMessages,
    sendMessage,
    fetchUnreadCount,
    startPolling,
    stopPolling,
    getInitial,
    getColor,
    formatTime,
  };
}
