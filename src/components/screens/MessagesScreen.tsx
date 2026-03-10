import React, { useState } from "react";
import { BackHeader } from "../findcollab/BackHeader";
import { Icon } from "../findcollab/Icon";

interface Props {
  onBack: () => void;
}

const MessagesScreen: React.FC<Props> = ({ onBack }) => {
  const [msg, setMsg] = useState("");

  const msgs = [
    { you: false, text: "Hi Dilraj, your application has been reviewed!", time: "10:30 AM" },
    { you: true, text: "Thank you! Looking forward to the collaboration.", time: "10:32 AM" },
    { you: false, text: "Please submit the Instagram reel by June 29th.", time: "10:35 AM" },
    { you: true, text: "https://www.instagram.com/reel/DFU4nHJSnaw/", time: "29 Apr" },
    { you: true, text: "https://www.instagram.com/reel/DFplm3CgM2/", time: "30 May" },
  ];

  return (
    <div className="flex-1 flex flex-col">
      <BackHeader title="Messages" onBack={onBack} />
      <div className="flex-1 overflow-y-auto px-4 pt-3.5 bg-background flex flex-col gap-2.5">
        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.you ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[78%] px-3 py-2.5 shadow-sm text-[13px] ${
                m.you
                  ? "bg-primary text-primary-foreground rounded-2xl rounded-br-sm"
                  : "bg-card text-foreground rounded-2xl rounded-bl-sm"
              }`}
            >
              <p className="mb-1 break-all leading-relaxed">{m.text}</p>
              <p className="text-[9px] opacity-60 text-right">{m.time}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="px-3 py-2.5 bg-card border-t border-border flex gap-2 items-center shrink-0">
        <input
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          placeholder="Type a message…"
          className="flex-1 py-2.5 px-3.5 rounded-xl border-[1.5px] border-border text-[13px] outline-none focus:border-primary transition-colors"
        />
        <button
          onClick={() => setMsg("")}
          className="w-[42px] h-[42px] rounded-xl bg-primary border-none flex items-center justify-center cursor-pointer"
        >
          <Icon name="send" size={17} className="text-primary-foreground" />
        </button>
      </div>
    </div>
  );
};

export default MessagesScreen;
