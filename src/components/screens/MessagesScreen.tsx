import React, { useState } from "react";
import { Screen } from "../findcollab/Screen";
import { Card } from "../findcollab/Card";
import { Icon } from "../findcollab/Icon";
import { Badge } from "../findcollab/Badge";

interface Conversation {
  id: string;
  brand: string;
  lastMsg: string;
  time: string;
  unread: number;
  status: "active" | "pending" | "completed";
  initial: string;
  color: string;
}

const conversations: Conversation[] = [
  { id: "1", brand: "Nykaa", lastMsg: "Please submit the Instagram reel by June 29th.", time: "10:35 AM", unread: 2, status: "active", initial: "N", color: "bg-pink-500" },
  { id: "2", brand: "Swiggy Instamart", lastMsg: "We'd love to discuss a collaboration opportunity!", time: "Yesterday", unread: 1, status: "active", initial: "S", color: "bg-orange-500" },
  { id: "3", brand: "Sugar Cosmetics", lastMsg: "Your content performed amazingly! 🎉", time: "2d ago", unread: 0, status: "completed", initial: "S", color: "bg-rose-500" },
  { id: "4", brand: "VIVO India", lastMsg: "Can you share your YouTube analytics?", time: "3d ago", unread: 3, status: "active", initial: "V", color: "bg-blue-500" },
  { id: "5", brand: "Wow Momo", lastMsg: "Deal confirmed! Looking forward to the collab.", time: "1w ago", unread: 0, status: "completed", initial: "W", color: "bg-yellow-500" },
  { id: "6", brand: "Practo", lastMsg: "Hi, we're interested in a health awareness campaign.", time: "1w ago", unread: 0, status: "pending", initial: "P", color: "bg-green-500" },
];

interface ChatMessage {
  you: boolean;
  text: string;
  time: string;
  attachment?: { name: string; type: string };
}

const chatMessages: Record<string, ChatMessage[]> = {
  "1": [
    { you: false, text: "Hi Dilraj, your application has been reviewed!", time: "10:30 AM" },
    { you: true, text: "Thank you! Looking forward to the collaboration.", time: "10:32 AM" },
    { you: false, text: "Please submit the Instagram reel by June 29th.", time: "10:35 AM" },
    { you: true, text: "https://www.instagram.com/reel/DFU4nHJSnaw/", time: "29 Apr" },
  ],
  "2": [
    { you: false, text: "Hi! We love your science content and would love to collaborate.", time: "11:00 AM" },
    { you: false, text: "We're launching a new quick delivery campaign.", time: "11:01 AM" },
    { you: true, text: "Sounds exciting! Let me check the details.", time: "11:15 AM" },
  ],
  "4": [
    { you: false, text: "Hey Dilraj, we have a new phone launch coming up.", time: "9:00 AM" },
    { you: false, text: "Can you share your YouTube analytics?", time: "9:02 AM" },
    { you: true, text: "Sure, I'll send my media kit.", time: "9:30 AM", attachment: { name: "MediaKit_2026.pdf", type: "pdf" } },
  ],
};

interface Props {
  push?: (screen: string, data?: any) => void;
  onBack?: () => void;
  onChatOpen?: (isOpen: boolean) => void;
}

const MessagesScreen: React.FC<Props> = ({ push, onBack, onChatOpen }) => {
  const [search, setSearch] = useState("");
  const [activeChat, setActiveChat] = useState<Conversation | null>(null);

  const openChat = (conv: Conversation) => {
    setActiveChat(conv);
    onChatOpen?.(true);
  };

  const closeChat = () => {
    setActiveChat(null);
    onChatOpen?.(false);
  };
  const [msg, setMsg] = useState("");
  const [showAttachMenu, setShowAttachMenu] = useState(false);

  const filtered = conversations.filter(
    (c) =>
      !search ||
      c.brand.toLowerCase().includes(search.toLowerCase()) ||
      c.lastMsg.toLowerCase().includes(search.toLowerCase())
  );

  const totalUnread = conversations.reduce((sum, c) => sum + c.unread, 0);

  // Chat view
  if (activeChat) {
    const messages = chatMessages[activeChat.id] || [
      { you: false, text: activeChat.lastMsg, time: activeChat.time },
    ];

    return (
      <div className="flex-1 flex flex-col bg-background">
        {/* Chat Header */}
        <div className="bg-card border-b border-border px-3 py-2.5 flex items-center gap-3 shrink-0">
          <button
            onClick={closeChat}
            className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center cursor-pointer border-none"
          >
            <Icon name="chevL" size={18} className="text-foreground" />
          </button>
          <div className={`w-9 h-9 rounded-xl ${activeChat.color} flex items-center justify-center shrink-0`}>
            <span className="text-white text-sm font-black">{activeChat.initial}</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-foreground">{activeChat.brand}</p>
            <p className="text-[10px] text-muted-foreground">
              {activeChat.status === "active" ? "🟢 Active" : activeChat.status === "pending" ? "🟡 Pending" : "✅ Completed"}
            </p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 pt-3.5 flex flex-col gap-2.5">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.you ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[78%] px-3 py-2.5 shadow-sm text-[13px] ${
                  m.you
                    ? "bg-primary text-primary-foreground rounded-2xl rounded-br-sm"
                    : "bg-card text-foreground rounded-2xl rounded-bl-sm border border-border"
                }`}
              >
                <p className="mb-1 break-all leading-relaxed">{m.text}</p>
                {m.attachment && (
                  <div className={`mt-1.5 flex items-center gap-2 px-2.5 py-1.5 rounded-lg ${m.you ? "bg-white/15" : "bg-muted"}`}>
                    <Icon name="attach" size={14} className={m.you ? "text-primary-foreground" : "text-primary"} />
                    <span className={`text-[11px] font-medium ${m.you ? "text-primary-foreground" : "text-foreground"}`}>
                      {m.attachment.name}
                    </span>
                  </div>
                )}
                <p className="text-[9px] opacity-60 text-right">{m.time}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Input Bar with Attachment */}
        <div className="px-3 py-2.5 bg-card border-t border-border shrink-0 relative">
          {showAttachMenu && (
            <div className="absolute bottom-full left-3 mb-2 bg-card rounded-xl border border-border shadow-lg p-2 flex flex-col gap-1 min-w-[160px]">
              {[
                { ic: "campaign", label: "Photo / Video", desc: "From gallery" },
                { ic: "attach", label: "Document", desc: "PDF, DOC, etc." },
                { ic: "mediakit", label: "Media Kit", desc: "Auto-attach kit" },
              ].map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => setShowAttachMenu(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-muted cursor-pointer border-none bg-transparent text-left w-full transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary-light flex items-center justify-center">
                    <Icon name={opt.ic} size={14} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">{opt.label}</p>
                    <p className="text-[9px] text-muted-foreground">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-2 items-center">
            <button
              className="w-[42px] h-[42px] rounded-xl bg-muted border-none flex items-center justify-center cursor-pointer shrink-0"
              onClick={() => setShowAttachMenu(!showAttachMenu)}
            >
              <Icon name="attach" size={18} className="text-muted-foreground" />
            </button>
            <input
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              placeholder="Type a message…"
              className="flex-1 py-2.5 px-3.5 rounded-xl border-[1.5px] border-border text-[13px] outline-none focus:border-primary transition-colors bg-background text-foreground"
            />
            <button
              onClick={() => setMsg("")}
              className="w-[42px] h-[42px] rounded-xl bg-primary border-none flex items-center justify-center cursor-pointer shrink-0"
            >
              <Icon name="send" size={17} className="text-primary-foreground" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Conversation List view
  return (
    <Screen>
      <div className="px-4 pt-4 pb-3 bg-card border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-black text-foreground">Messages</h1>
          {totalUnread > 0 && <Badge color="pink">{totalUnread} unread</Badge>}
        </div>

        {/* Search */}
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            <Icon name="search" size={16} className="text-muted-foreground" />
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search messages..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border-[1.5px] border-border text-sm bg-background text-foreground outline-none focus:border-primary transition-colors placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <div className="px-4 pt-3 flex flex-col gap-1.5">
        {filtered.length === 0 && (
          <div className="py-10 text-center">
            <Icon name="msg" size={32} className="text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No messages found</p>
          </div>
        )}
        {filtered.map((conv) => (
          <Card
            key={conv.id}
            className="!p-3 cursor-pointer"
            onClick={() => setActiveChat(conv)}
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className={`w-11 h-11 rounded-[14px] ${conv.color} flex items-center justify-center shrink-0`}>
                  <span className="text-white text-sm font-black">{conv.initial}</span>
                </div>
                {conv.status === "active" && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-card" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <p className="text-[13px] font-bold text-foreground">{conv.brand}</p>
                  <span className="text-[10px] text-muted-foreground shrink-0">{conv.time}</span>
                </div>
                <p className="text-[11px] text-muted-foreground truncate">{conv.lastMsg}</p>
              </div>
              {conv.unread > 0 && (
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                  <span className="text-[9px] font-black text-primary-foreground">{conv.unread}</span>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </Screen>
  );
};

export default MessagesScreen;