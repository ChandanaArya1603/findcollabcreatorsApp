import { api } from "@/lib/api";

export const messageService = {
  getChatUsers: () =>
    api.get("/chat_users"),

  getMessages: (receiver_id?: number) =>
    api.get(receiver_id ? `/messages?receiver_id=${receiver_id}` : "/messages"),

  sendMessage: (receiver_id: number, message: string) =>
    api.post("/send_message", { receiver_id, message }),

  getUnreadCount: () =>
    api.get("/unread_messages_count"),

  checkNewMessages: (last_check_time: string) =>
    api.post("/check_new_messages", { last_check_time }),
};
