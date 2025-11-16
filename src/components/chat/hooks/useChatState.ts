import { useRef, useState } from "react";

export interface Message {
  id: number;
  sender: "user" | "ai";
  text: string;
  timestamp: Date;
}

export function useChatState() {
  const [messages, setMessages] = useState<Message[]>([]);

  // Carga / estado de API
  const [chatId, setChatId] = useState<string | null>(null);
  const [loadingChat, setLoadingChat] = useState(true);
  const [chats, setChats] = useState<any[]>([]);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [expandedIds, setExpandedIds] = useState<Record<number, boolean>>({});
  const userIdRef = useRef<string>("");
  const userNameRef = useRef<string>("");
  const [profileName, setProfileName] = useState<string>("");

  // UI
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const scrollRootRef = useRef<HTMLDivElement>(null);
  const MAX_AI_PREVIEW_CHARS = 700;

  return {
    // mensajes
    messages,
    setMessages,
    // carga
    chatId,
    setChatId,
    loadingChat,
    setLoadingChat,
    chats,
    setChats,
    copiedId,
    setCopiedId,
    expandedIds,
    setExpandedIds,
    userIdRef,
    userNameRef,
    profileName,
    setProfileName,
    // UI
    input,
    setInput,
    sending,
    setSending,
    showScrollToBottom,
    setShowScrollToBottom,
    errorMsg,
    setErrorMsg,
    isStreaming,
    setIsStreaming,
    endRef,
    scrollRootRef,
    MAX_AI_PREVIEW_CHARS,
  } as const;
}
