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

/* ──────────────── Demo Data ──────────────────── */

const DEMO_CHAT_USERS: ChatUser[] = [
  { id: 1, name: "Nykaa", lastMessage: "Please submit the Instagram reel by June 29th.", lastMessageTime: new Date(Date.now() - 3600000).toISOString(), unreadCount: 2, isOnline: true },
  { id: 2, name: "Swiggy Instamart", lastMessage: "We'd love to discuss a collaboration opportunity!", lastMessageTime: new Date(Date.now() - 86400000).toISOString(), unreadCount: 1, isOnline: true },
  { id: 3, name: "Sugar Cosmetics", lastMessage: "Your content performed amazingly! 🎉", lastMessageTime: new Date(Date.now() - 172800000).toISOString(), unreadCount: 0, isOnline: false },
  { id: 4, name: "VIVO India", lastMessage: "Can you share your YouTube analytics?", lastMessageTime: new Date(Date.now() - 259200000).toISOString(), unreadCount: 3, isOnline: true },
  { id: 5, name: "Wow Momo", lastMessage: "Deal confirmed! Looking forward to the collab.", lastMessageTime: new Date(Date.now() - 604800000).toISOString(), unreadCount: 0, isOnline: false },
  { id: 6, name: "Practo", lastMessage: "Hi, we're interested in a health awareness campaign.", lastMessageTime: new Date(Date.now() - 604800000).toISOString(), unreadCount: 0, isOnline: false },
];

const DEMO_MESSAGES: Record<number, Message[]> = {
  1: [
    { id: 101, senderId: 1, receiverId: 0, message: "Hi Dilraj, your application has been reviewed!", createdAt: new Date(Date.now() - 3900000).toISOString(), isOwn: false },
    { id: 102, senderId: 0, receiverId: 1, message: "Thank you! Looking forward to the collaboration.", createdAt: new Date(Date.now() - 3780000).toISOString(), isOwn: true },
    { id: 103, senderId: 1, receiverId: 0, message: "Please submit the Instagram reel by June 29th.", createdAt: new Date(Date.now() - 3600000).toISOString(), isOwn: false },
    { id: 104, senderId: 0, receiverId: 1, message: "https://www.instagram.com/reel/DFU4nHJSnaw/", createdAt: new Date(Date.now() - 3500000).toISOString(), isOwn: true },
  ],
  2: [
    { id: 201, senderId: 2, receiverId: 0, message: "Hi! We love your science content and would love to collaborate.", createdAt: new Date(Date.now() - 90000000).toISOString(), isOwn: false },
    { id: 202, senderId: 2, receiverId: 0, message: "We're launching a new quick delivery campaign.", createdAt: new Date(Date.now() - 89940000).toISOString(), isOwn: false },
    { id: 203, senderId: 0, receiverId: 2, message: "Sounds exciting! Let me check the details.", createdAt: new Date(Date.now() - 89100000).toISOString(), isOwn: true },
  ],
  4: [
    { id: 401, senderId: 4, receiverId: 0, message: "Hey Dilraj, we have a new phone launch coming up.", createdAt: new Date(Date.now() - 262800000).toISOString(), isOwn: false },
    { id: 402, senderId: 4, receiverId: 0, message: "Can you share your YouTube analytics?", createdAt: new Date(Date.now() - 262680000).toISOString(), isOwn: false },
    { id: 403, senderId: 0, receiverId: 4, message: "Sure, I'll send my media kit.", createdAt: new Date(Date.now() - 261000000).toISOString(), isOwn: true, attachment: { name: "MediaKit_2026.pdf", type: "pdf" } },
  ],
};

const isDemoUser = () => api.getToken() === "demo-token";

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
    if (isDemoUser()) {
      setChatUsers(DEMO_CHAT_USERS);
      setLoadingUsers(false);
      return;
    }
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
      if (isDemoUser()) {
        setMessages(DEMO_MESSAGES[receiverId] ?? [
          { id: Date.now(), senderId: receiverId, receiverId: 0, message: "Hello! 👋", createdAt: new Date().toISOString(), isOwn: false },
        ]);
        setLoadingMessages(false);
        return;
      }
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
