import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageSquarePlus, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  useGetConversations,
  useGetMessages,
  useSendMessage,
} from "../hooks/useQueries";

interface MessagesTabProps {
  username: string;
}

export function MessagesTab({ username }: MessagesTabProps) {
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [newChatUser, setNewChatUser] = useState("");

  if (!username) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
        <MessageSquarePlus className="w-12 h-12 text-muted-foreground" />
        <p className="text-muted-foreground text-sm">
          Set up your profile first to use chat.
        </p>
      </div>
    );
  }

  if (activeChat) {
    return (
      <ChatThread
        myUsername={username}
        otherUsername={activeChat}
        onBack={() => setActiveChat(null)}
      />
    );
  }

  return (
    <ConversationList
      username={username}
      onSelectChat={setActiveChat}
      newChatOpen={newChatOpen}
      setNewChatOpen={setNewChatOpen}
      newChatUser={newChatUser}
      setNewChatUser={setNewChatUser}
      onStartChat={(u) => {
        setActiveChat(u);
        setNewChatOpen(false);
        setNewChatUser("");
      }}
    />
  );
}

function ConversationList({
  username,
  onSelectChat,
  newChatOpen,
  setNewChatOpen,
  newChatUser,
  setNewChatUser,
  onStartChat,
}: {
  username: string;
  onSelectChat: (u: string) => void;
  newChatOpen: boolean;
  setNewChatOpen: (v: boolean) => void;
  newChatUser: string;
  setNewChatUser: (v: string) => void;
  onStartChat: (u: string) => void;
}) {
  const { data: conversations = [], isLoading } = useGetConversations(username);

  return (
    <div className="h-full overflow-y-auto">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <h2 className="text-lg font-bold text-foreground">Messages</h2>
        <button
          type="button"
          data-ocid="messages.open_modal_button"
          onClick={() => setNewChatOpen(true)}
          className="p-2 rounded-full hover:bg-secondary transition-colors"
        >
          <MessageSquarePlus className="w-5 h-5 text-primary" />
        </button>
      </div>

      {newChatOpen && (
        <div
          data-ocid="messages.panel"
          className="mx-4 mb-3 p-3 rounded-xl bg-card border border-border flex gap-2"
        >
          <input
            type="text"
            data-ocid="messages.input"
            placeholder="Enter username to chat..."
            value={newChatUser}
            onChange={(e) => setNewChatUser(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" &&
              newChatUser.trim() &&
              onStartChat(newChatUser.trim())
            }
            className="flex-1 bg-secondary/60 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <Button
            size="sm"
            data-ocid="messages.primary_button"
            disabled={!newChatUser.trim()}
            onClick={() =>
              newChatUser.trim() && onStartChat(newChatUser.trim())
            }
            className="gradient-brand text-white border-0"
          >
            Start
          </Button>
          <Button
            size="sm"
            variant="ghost"
            data-ocid="messages.cancel_button"
            onClick={() => {
              setNewChatOpen(false);
              setNewChatUser("");
            }}
          >
            Cancel
          </Button>
        </div>
      )}

      {isLoading ? (
        <div
          data-ocid="messages.loading_state"
          className="px-4 py-8 text-center text-muted-foreground text-sm"
        >
          Loading conversations...
        </div>
      ) : conversations.length === 0 ? (
        <div
          data-ocid="messages.empty_state"
          className="px-4 py-12 flex flex-col items-center gap-3 text-center"
        >
          <MessageSquarePlus className="w-12 h-12 text-muted-foreground/40" />
          <p className="text-muted-foreground text-sm">No conversations yet.</p>
          <Button
            size="sm"
            data-ocid="messages.secondary_button"
            onClick={() => setNewChatOpen(true)}
            className="gradient-brand text-white border-0 text-xs"
          >
            Start a New Chat
          </Button>
        </div>
      ) : (
        <div className="px-4 space-y-2 pb-4">
          {conversations.map((user, i) => (
            <button
              type="button"
              key={user}
              data-ocid={`messages.item.${i + 1}`}
              onClick={() => onSelectChat(user)}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-card/60 border border-border hover:bg-card transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-full gradient-brand flex items-center justify-center text-white font-bold shrink-0">
                {user[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-sm text-foreground">
                  @{user}
                </span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Tap to open chat
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ChatThread({
  myUsername,
  otherUsername,
  onBack,
}: { myUsername: string; otherUsername: string; onBack: () => void }) {
  const { data: messages = [] } = useGetMessages(myUsername, otherUsername);
  const sendMessage = useSendMessage();
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll to bottom whenever messages update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setText("");
    await sendMessage.mutateAsync({
      fromUser: myUsername,
      toUser: otherUsername,
      text: trimmed,
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-[#0F172A]/80">
        <button
          type="button"
          data-ocid="messages.secondary_button"
          onClick={onBack}
          className="p-1.5 rounded-full hover:bg-secondary transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <Avatar className="w-8 h-8">
          <AvatarFallback className="gradient-brand text-white text-xs font-bold">
            {otherUsername[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span className="font-semibold text-foreground">@{otherUsername}</span>
      </div>

      <div
        data-ocid="messages.list"
        className="flex-1 overflow-y-auto px-4 py-3 space-y-2"
      >
        {messages.length === 0 && (
          <div
            data-ocid="messages.empty_state"
            className="text-center text-muted-foreground text-sm py-8"
          >
            Say hi to @{otherUsername}! 👋
          </div>
        )}
        {messages.map((msg, i) => {
          const isMine = msg.fromUser === myUsername;
          return (
            <div
              key={Number(msg.id)}
              data-ocid={`messages.item.${i + 1}`}
              className={`flex ${isMine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${isMine ? "gradient-brand text-white rounded-br-sm" : "bg-card border border-border text-foreground rounded-bl-sm"}`}
              >
                {msg.text}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="flex items-center gap-2 px-4 py-3 border-t border-border bg-[#0F172A]/80">
        <input
          type="text"
          data-ocid="messages.input"
          placeholder={`Message @${otherUsername}...`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          className="flex-1 bg-secondary/60 border border-border rounded-full px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        <button
          type="button"
          data-ocid="messages.primary_button"
          onClick={handleSend}
          disabled={!text.trim() || sendMessage.isPending}
          className="w-9 h-9 rounded-full gradient-brand flex items-center justify-center shrink-0 disabled:opacity-40"
        >
          <Send className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );
}
