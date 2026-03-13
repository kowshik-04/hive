import { memo, useState, useRef, useEffect, useCallback } from "react";
import { Send, Square, Crown, Cpu, Copy, RotateCcw, Trash2, Pin, Pencil } from "lucide-react";
import { formatAgentDisplayName } from "@/lib/chat-helpers";
import MarkdownContent from "@/components/MarkdownContent";

export interface ChatMessage {
  id: string;
  agent: string;
  agentColor: string;
  content: string;
  timestamp: string;
  type?: "system" | "agent" | "user" | "tool_status";
  role?: "queen" | "worker";
  /** Which worker thread this message belongs to (worker agent name) */
  thread?: string;
}

interface ChatPanelProps {
  messages: ChatMessage[];
  onSend: (message: string, thread: string) => void;
  isWaiting?: boolean;
  activeThread: string;
  /** When true, the agent is waiting for user input — changes placeholder text */
  awaitingInput?: boolean;
  /** When true, the input is disabled (e.g. during loading) */
  disabled?: boolean;
  /** Called when user clicks the stop button to cancel the queen's current turn */
  onCancel?: () => void;
}

const queenColor = "hsl(45,95%,58%)";

function getColor(_agent: string, role?: "queen" | "worker"): string {
  if (role === "queen") return queenColor;
  return "hsl(220,60%,55%)";
}

let _localIdSeq = 0;

interface MessageBubbleProps {
  msg: ChatMessage;
  isPinned: boolean;
  onCopy: (msg: ChatMessage) => void;
  onEdit: (msg: ChatMessage) => void;
  onRetry: (msg: ChatMessage) => void;
  onTogglePin: (msg: ChatMessage) => void;
  onDelete: (msg: ChatMessage) => void;
}

const MessageBubble = memo(function MessageBubble({
  msg,
  isPinned,
  onCopy,
  onEdit,
  onRetry,
  onTogglePin,
  onDelete,
}: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);

  const isUser = msg.type === "user";
  const isQueen = msg.role === "queen";
  const color = getColor(msg.agent, msg.role);

  const handleCopy = useCallback(async () => {
    onCopy(msg);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [msg, onCopy]);

  if (msg.type === "system") {
    return (
      <div className="flex justify-center py-1">
        <span className="text-[11px] text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-full">
          {msg.content}
        </span>
      </div>
    );
  }

  if (msg.type === "tool_status") {
    return (
      <div className="flex gap-3 pl-10">
        <span className="text-[11px] text-muted-foreground bg-muted/40 px-3 py-1 rounded-full border border-border/40">
          {msg.content}
        </span>
      </div>
    );
  }

  if (isUser) {
    return (
      <div className="flex flex-col items-end group">
        <div className="max-w-[75%] bg-primary text-primary-foreground text-sm leading-relaxed rounded-2xl rounded-br-md px-4 py-3">
          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
        </div>

        {/* Message Actions */}
        <div className="flex gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleCopy}
            title="Copy message"
            className="p-1 rounded hover:bg-muted"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => onEdit(msg)}
            title="Edit message"
            className="p-1 rounded hover:bg-muted"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => onRetry(msg)}
            title="Retry message"
            className="p-1 rounded hover:bg-muted"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => onTogglePin(msg)}
            title={isPinned ? "Unpin message" : "Pin message"}
            className={`p-1 rounded hover:bg-muted ${isPinned ? "text-primary" : ""}`}
          >
            <Pin className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => onDelete(msg)}
            title="Delete message"
            className="p-1 rounded hover:bg-muted"
          >
            <Trash2 className="w-3.5 h-3.5 text-destructive" />
          </button>
        </div>

        {isPinned && (
          <span className="text-[10px] text-primary mt-1">Pinned</span>
        )}

        {copied && (
          <span className="text-[10px] text-muted-foreground mt-1">
            Copied
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex gap-3 group">
      <div
        className={`flex-shrink-0 ${isQueen ? "w-9 h-9" : "w-7 h-7"} rounded-xl flex items-center justify-center`}
        style={{
          backgroundColor: `${color}18`,
          border: `1.5px solid ${color}35`,
          boxShadow: isQueen ? `0 0 12px ${color}20` : undefined,
        }}
      >
        {isQueen ? (
          <Crown className="w-4 h-4" style={{ color }} />
        ) : (
          <Cpu className="w-3.5 h-3.5" style={{ color }} />
        )}
      </div>
      <div className={`flex-1 min-w-0 ${isQueen ? "max-w-[85%]" : "max-w-[75%]"}`}>
        <div className="flex items-center gap-2 mb-1">
          <span className={`font-medium ${isQueen ? "text-sm" : "text-xs"}`} style={{ color }}>
            {msg.agent}
          </span>
          <span
            className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${
              isQueen ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
            }`}
          >
            {isQueen ? "Queen" : "Worker"}
          </span>
        </div>
        <div
          className={`text-sm leading-relaxed rounded-2xl rounded-tl-md px-4 py-3 ${
            isQueen ? "border border-primary/20 bg-primary/5" : "bg-muted/60"
          }`}
        >
          <MarkdownContent content={msg.content} />
        </div>
        <div className="flex gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleCopy}
            title="Copy message"
            className="p-1 rounded hover:bg-muted"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onTogglePin(msg)}
            title={isPinned ? "Unpin message" : "Pin message"}
            className={`p-1 rounded hover:bg-muted ${isPinned ? "text-primary" : ""}`}
          >
            <Pin className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(msg)}
            title="Delete message"
            className="p-1 rounded hover:bg-muted"
          >
            <Trash2 className="w-3.5 h-3.5 text-destructive" />
          </button>
        </div>
        {isPinned && <span className="text-[10px] text-primary mt-1">Pinned</span>}
        {copied && (
          <span className="text-[10px] text-muted-foreground mt-1">Copied</span>
        )}
      </div>
    </div>
  );
}, (prev, next) => (
  prev.msg.id === next.msg.id &&
  prev.msg.content === next.msg.content &&
  prev.isPinned === next.isPinned
));

export default function ChatPanel({ messages, onSend, isWaiting, activeThread, awaitingInput, disabled, onCancel }: ChatPanelProps) {
  const [input, setInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [readMap, setReadMap] = useState<Record<string, number>>({});
  const [pinnedMessageIds, setPinnedMessageIds] = useState<string[]>([]);
  const [deletedMessageIds, setDeletedMessageIds] = useState<string[]>([]);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [pinNotice, setPinNotice] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Optimistic local buffer: immediately display user messages even if the
  // parent state update hasn't propagated them into the `messages` prop yet.
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);

  // Remove local messages once the parent prop includes a matching user message
  useEffect(() => {
    setLocalMessages((prev) => {
      if (prev.length === 0) return prev;
      const remaining = prev.filter(
        (local) =>
          !messages.some(
            (m) =>
              m.type === "user" &&
              m.content === local.content &&
              m.thread === local.thread,
          ),
      );
      return remaining.length === prev.length ? prev : remaining;
    });
  }, [messages]);

  // Build display list: prop messages + any local messages not yet in props
  const pendingLocal = localMessages.filter(
    (local) =>
      local.thread === activeThread &&
      !messages.some(
        (m) =>
          m.type === "user" &&
          m.content === local.content &&
          m.thread === local.thread,
      ),
  );

  const threadMessages = messages
    .filter((m) => {
      if (m.type === "system" && !m.thread) return false;
      return m.thread === activeThread;
    })
    .concat(pendingLocal);

  const visibleThreadMessages = threadMessages.filter(
    (m) => !deletedMessageIds.includes(m.id),
  );

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredThreadMessages = normalizedSearch
    ? visibleThreadMessages.filter((msg) => {
        const content = msg.content.toLowerCase();
        const agent = msg.agent.toLowerCase();
        return content.includes(normalizedSearch) || agent.includes(normalizedSearch);
      })
    : visibleThreadMessages;

  console.log('[ChatPanel] render: messages:', messages.length, 'threadMessages:', visibleThreadMessages.length, 'localPending:', pendingLocal.length, 'activeThread:', activeThread);

  // Mark current thread as read
  useEffect(() => {
    const count = messages.filter((m) => m.thread === activeThread).length;
    setReadMap((prev) => ({ ...prev, [activeThread]: count }));
  }, [activeThread, messages]);

  // Suppress unused var
  void readMap;

  const lastMsg = visibleThreadMessages[visibleThreadMessages.length - 1];
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [visibleThreadMessages.length, lastMsg?.content]);

  const appendLocalUserMessage = useCallback((text: string) => {
    const localMsg: ChatMessage = {
      id: `local-${Date.now()}-${++_localIdSeq}`,
      agent: "You",
      agentColor: "",
      content: text,
      timestamp: "",
      type: "user",
      thread: activeThread,
    };
    setLocalMessages((prev) => [...prev, localMsg]);
  }, [activeThread]);

  const handleRetry = useCallback((msg: ChatMessage) => {
    if (!msg.content.trim()) return;
    appendLocalUserMessage(msg.content);
    onSend(msg.content, activeThread);
  }, [activeThread, appendLocalUserMessage, onSend]);

  const handleTogglePin = useCallback((msg: ChatMessage) => {
    setPinnedMessageIds((prev) => {
      if (prev.includes(msg.id)) {
        setPinNotice(null);
        return prev.filter((id) => id !== msg.id);
      }
      if (prev.length >= 10) {
        setPinNotice("You can pin up to 10 messages.");
        return prev;
      }
      setPinNotice(null);
      return [...prev, msg.id];
    });
  }, []);

  const handleEdit = useCallback((msg: ChatMessage) => {
    setInput(msg.content);
    setEditingMessageId(msg.id);
  }, []);

  const handleDelete = useCallback((msg: ChatMessage) => {
    setDeletedMessageIds((prev) => (prev.includes(msg.id) ? prev : [...prev, msg.id]));
    setPinnedMessageIds((prev) => prev.filter((id) => id !== msg.id));
  }, []);

  const handleCopyMessage = useCallback(async (msg: ChatMessage) => {
    try {
      await navigator.clipboard.writeText(msg.content);
    } catch (e) {
      console.error("Copy failed", e);
    }
  }, []);

  const pinnedMessages = pinnedMessageIds
    .map((id) => visibleThreadMessages.find((m) => m.id === id))
    .filter((m): m is ChatMessage => Boolean(m));

  const scrollToMessage = useCallback((messageId: string) => {
    messageRefs.current[messageId]?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const text = input.trim();

    if (editingMessageId) {
      appendLocalUserMessage(text);
      onSend(text, activeThread);
      setInput("");
      setEditingMessageId(null);
      return;
    }

    appendLocalUserMessage(text);

    onSend(text, activeThread);
    setInput("");
  };

  const activeWorkerLabel = formatAgentDisplayName(activeThread);

  return (
    <div className="flex flex-col h-full min-w-0">
      {/* Compact sub-header */}
      <div className="px-5 pt-4 pb-2 flex items-center gap-2">
        <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Conversation</p>
      </div>

      <div className="px-5 pb-2">
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search messages..."
          className="w-full h-8 px-3 rounded-md bg-muted/40 border border-border text-xs text-foreground outline-none focus:border-primary/40"
        />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto px-5 py-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">Pinned: {pinnedMessageIds.length}/10</span>
          {pinNotice && <span className="text-[11px] text-destructive">{pinNotice}</span>}
        </div>

        {pinnedMessages.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {pinnedMessages.map((msg) => (
              <div
                key={`pinned-${msg.id}`}
                className="flex items-center max-w-[280px] rounded-full border border-primary/30 bg-primary/10 text-primary"
              >
                <button
                  type="button"
                  onClick={() => scrollToMessage(msg.id)}
                  className="min-w-0 flex-1 truncate text-left text-[11px] px-2.5 py-1 hover:bg-primary/15 rounded-l-full"
                  title="Jump to pinned message"
                >
                  {msg.content.slice(0, 50)}{msg.content.length > 50 ? "..." : ""}
                </button>
                <button
                  type="button"
                  onClick={() => handleTogglePin(msg)}
                  className="shrink-0 px-2 py-1 border-l border-primary/20 hover:bg-primary/15 rounded-r-full"
                  title="Unpin message"
                >
                  <Pin className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {filteredThreadMessages.map((msg) => (
          <div
            key={msg.id}
            ref={(element) => {
              messageRefs.current[msg.id] = element;
            }}
          >
            <MessageBubble
              msg={msg}
              isPinned={pinnedMessageIds.includes(msg.id)}
              onCopy={handleCopyMessage}
              onEdit={handleEdit}
              onRetry={handleRetry}
              onTogglePin={handleTogglePin}
              onDelete={handleDelete}
            />
          </div>
        ))}

        {filteredThreadMessages.length === 0 && (
          <div className="text-xs text-muted-foreground py-6 text-center">
            No messages found.
          </div>
        )}

        {isWaiting && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-xl bg-muted flex items-center justify-center">
              <Cpu className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
            <div className="bg-muted/60 rounded-2xl rounded-tl-md px-4 py-3">
              <div className="flex gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-border">
        <div className="flex items-center gap-3 bg-muted/40 rounded-xl px-4 py-2.5 border border-border focus-within:border-primary/40 transition-colors">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              disabled
                ? "Connecting to agent..."
                : awaitingInput
                  ? "Agent is waiting for your response..."
                  : editingMessageId
                    ? "Edit your message and send again..."
                    : `Message ${activeWorkerLabel}...`
            }
            disabled={disabled}
            className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {isWaiting && onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              className="p-2 rounded-lg bg-destructive text-destructive-foreground hover:opacity-90 transition-opacity"
            >
              <Square className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim() || disabled}
              className="p-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-30 hover:opacity-90 transition-opacity"
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
