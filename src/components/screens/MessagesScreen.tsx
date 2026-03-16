import React, { useState, useEffect, useCallback } from "react";
import { useMessages, type ChatUser } from "@/hooks/useMessages";
import ConversationList from "./ConversationList";
import ChatView from "./ChatView";

interface Props {
  push?: (screen: string, data?: any) => void;
  onBack?: () => void;
  onChatOpen?: (isOpen: boolean) => void;
}

const MessagesScreen: React.FC<Props> = ({ push, onBack, onChatOpen }) => {
  const {
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
    startPolling,
    stopPolling,
    getInitial,
    getColor,
    formatTime,
  } = useMessages();

  const [search, setSearch] = useState("");
  const [activeUser, setActiveUser] = useState<ChatUser | null>(null);
  const [msg, setMsg] = useState("");
  const [showAttachMenu, setShowAttachMenu] = useState(false);

  const openChat = useCallback(
    (user: ChatUser) => {
      setActiveUser(user);
      onChatOpen?.(true);
      fetchMessages(user.id);
      startPolling(user.id);
    },
    [onChatOpen, fetchMessages, startPolling]
  );

  const closeChat = useCallback(() => {
    setActiveUser(null);
    onChatOpen?.(false);
    stopPolling();
    // Refresh conversation list to update last messages / unread counts
    fetchChatUsers();
  }, [onChatOpen, stopPolling, fetchChatUsers]);

  const handleSend = useCallback(() => {
    if (!activeUser || !msg.trim()) return;
    sendMessage(activeUser.id, msg.trim());
    setMsg("");
    setShowAttachMenu(false);
  }, [activeUser, msg, sendMessage]);

  // Cleanup polling on unmount
  useEffect(() => () => stopPolling(), [stopPolling]);

  if (activeUser) {
    return (
      <ChatView
        user={{
          id: activeUser.id,
          name: activeUser.name,
          initial: getInitial(activeUser.name),
          color: getColor(activeUser.id),
          isOnline: activeUser.isOnline,
        }}
        messages={messages}
        loading={loadingMessages}
        sending={sending}
        msg={msg}
        setMsg={setMsg}
        showAttachMenu={showAttachMenu}
        setShowAttachMenu={setShowAttachMenu}
        onSend={handleSend}
        onBack={closeChat}
        formatTime={formatTime}
      />
    );
  }

  return (
    <ConversationList
      chatUsers={chatUsers}
      loading={loadingUsers}
      error={error}
      search={search}
      setSearch={setSearch}
      totalUnread={totalUnread}
      onSelectUser={openChat}
      getInitial={getInitial}
      getColor={getColor}
      formatTime={formatTime}
      onRetry={fetchChatUsers}
    />
  );
};

export default MessagesScreen;
