import React from "react";
import { Icon } from "../findcollab/Icon";

interface ChatMessage {
  id: number;
  message: string;
  isOwn: boolean;
  createdAt: string;
  attachment?: { name: string; type: string; url?: string };
}

interface ActiveUser {
  id: number;
  name: string;
  initial: string;
  color: string;
  isOnline: boolean;
}

interface Props {
  user: ActiveUser;
  messages: ChatMessage[];
  loading: boolean;
  sending: boolean;
  msg: string;
  setMsg: (v: string) => void;
  showAttachMenu: boolean;
  setShowAttachMenu: (v: boolean) => void;
  onSend: () => void;
  onBack: () => void;
  formatTime: (t: string) => string;
}

const ChatView: React.FC<Props> = ({
  user,
  messages,
  loading,
  sending,
  msg,
  setMsg,
  showAttachMenu,
  setShowAttachMenu,
  onSend,
  onBack,
  formatTime,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Chat Header */}
      <div className="bg-card border-b border-border px-3 py-2.5 flex items-center gap-3 shrink-0">
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center cursor-pointer border-none"
        >
          <Icon name="chevL" size={18} className="text-foreground" />
        </button>
        <div className={`w-9 h-9 rounded-xl ${user.color} flex items-center justify-center shrink-0`}>
          <span className="text-white text-sm font-black">{user.initial}</span>
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-foreground">{user.name}</p>
          <p className="text-[10px] text-muted-foreground">
            {user.isOnline ? "🟢 Online" : "⚪ Offline"}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 pt-3.5 flex flex-col gap-2.5">
        {loading ? (
          <div className="flex-1 flex items-center justify-center py-10">
            <p className="text-sm text-muted-foreground">Loading messages…</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-10">
            <Icon name="msg" size={32} className="text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No messages yet. Say hi! 👋</p>
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`flex ${m.isOwn ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[78%] px-3 py-2.5 shadow-sm text-[13px] ${
                  m.isOwn
                    ? "bg-primary text-primary-foreground rounded-2xl rounded-br-sm"
                    : "bg-card text-foreground rounded-2xl rounded-bl-sm border border-border"
                }`}
              >
                <p className="mb-1 break-all leading-relaxed">{m.message}</p>
                {m.attachment && (
                  <div
                    className={`mt-1.5 flex items-center gap-2 px-2.5 py-1.5 rounded-lg ${
                      m.isOwn ? "bg-white/15" : "bg-muted"
                    }`}
                  >
                    <Icon
                      name="attach"
                      size={14}
                      className={m.isOwn ? "text-primary-foreground" : "text-primary"}
                    />
                    <span
                      className={`text-[11px] font-medium ${
                        m.isOwn ? "text-primary-foreground" : "text-foreground"
                      }`}
                    >
                      {m.attachment.name}
                    </span>
                  </div>
                )}
                <p className="text-[9px] opacity-60 text-right">{formatTime(m.createdAt)}</p>
              </div>
            </div>
          ))
        )}
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
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
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
            onKeyDown={handleKeyDown}
            placeholder="Type a message…"
            className="flex-1 py-2.5 px-3.5 rounded-xl border-[1.5px] border-border text-[13px] outline-none focus:border-primary transition-colors bg-background text-foreground"
          />
          <button
            onClick={onSend}
            disabled={sending || !msg.trim()}
            className="w-[42px] h-[42px] rounded-xl bg-primary border-none flex items-center justify-center cursor-pointer shrink-0 disabled:opacity-50"
          >
            <Icon name="send" size={17} className="text-primary-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatView;
