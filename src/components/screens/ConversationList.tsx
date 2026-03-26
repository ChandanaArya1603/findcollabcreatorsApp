import React from "react";
import { Screen } from "../findcollab/Screen";
import { Card } from "../findcollab/Card";
import { Icon } from "../findcollab/Icon";
import { Badge } from "../findcollab/Badge";
import type { ChatUser } from "@/hooks/useMessages";

interface Props {
  chatUsers: ChatUser[];
  loading: boolean;
  error: string | null;
  search: string;
  setSearch: (v: string) => void;
  totalUnread: number;
  onSelectUser: (user: ChatUser) => void;
  getInitial: (name: string) => string;
  getColor: (id: number) => string;
  formatTime: (t: string) => string;
  onRetry: () => void;
  onBack?: () => void;
}

const ConversationList: React.FC<Props> = ({
  chatUsers,
  loading,
  error,
  search,
  setSearch,
  totalUnread,
  onSelectUser,
  getInitial,
  getColor,
  formatTime,
  onRetry,
}) => {
  const filtered = chatUsers.filter(
    (c) =>
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.lastMessage.toLowerCase().includes(search.toLowerCase())
  );

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
        {/* Loading state */}
        {loading && (
          <div className="py-10 text-center">
            <p className="text-sm text-muted-foreground">Loading conversations…</p>
          </div>
        )}

        {/* Error state - only show if no conversations loaded */}
        {!loading && error && chatUsers.length === 0 && (
          <div className="py-10 text-center">
            <Icon name="msg" size={32} className="text-destructive mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-2">{error}</p>
            <button
              onClick={onRetry}
              className="text-xs font-semibold text-primary cursor-pointer border-none bg-transparent"
            >
              Tap to retry
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && filtered.length === 0 && (
          <div className="py-10 text-center">
            <Icon name="msg" size={32} className="text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {search ? "No messages found" : "No conversations yet"}
            </p>
          </div>
        )}

        {/* Conversation list */}
        {!loading &&
          filtered.map((chatUser) => (
            <Card
              key={chatUser.id}
              className="!p-3 cursor-pointer"
              onClick={() => onSelectUser(chatUser)}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div
                    className={`w-11 h-11 rounded-[14px] ${getColor(chatUser.id)} flex items-center justify-center shrink-0`}
                  >
                    <span className="text-white text-sm font-black">
                      {getInitial(chatUser.name)}
                    </span>
                  </div>
                  {chatUser.isOnline && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-card" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-[13px] font-bold text-foreground">{chatUser.name}</p>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {formatTime(chatUser.lastMessageTime)}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {chatUser.lastMessage}
                  </p>
                </div>
                {chatUser.unreadCount > 0 && (
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <span className="text-[9px] font-black text-primary-foreground">
                      {chatUser.unreadCount}
                    </span>
                  </div>
                )}
              </div>
            </Card>
          ))}
      </div>
    </Screen>
  );
};

export default ConversationList;
