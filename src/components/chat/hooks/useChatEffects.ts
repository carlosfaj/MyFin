import { useEffect, useRef } from "react";
import { Message } from "./useChatState";

export function useChatEffects(state: ReturnType<typeof import('./useChatState').useChatState>, history: any) {
  const {
    endRef,
    messages,
    setShowScrollToBottom,
    scrollRootRef,
    setLoadingChat,
    setMessages,
    setLoadingChat: _setLoading,
    userIdRef,
    showScrollToBottom,
    chatId,
  } = state;

  const prevChatIdRef = useRef<string | null>(null);
  const prevMessagesLenRef = useRef<number | null>(null);

  useEffect(() => {
    try {
      const root = scrollRootRef.current;
      if (!root) {
        endRef.current?.scrollIntoView({ behavior: "smooth" });
        prevMessagesLenRef.current = messages?.length ?? 0;
        prevChatIdRef.current = chatId ?? null;
        return;
      }
      const viewport = root.querySelector('[data-slot="scroll-area-viewport"]') as HTMLDivElement | null;
      if (!viewport) {
        endRef.current?.scrollIntoView({ behavior: "smooth" });
        prevMessagesLenRef.current = messages?.length ?? 0;
        prevChatIdRef.current = chatId ?? null;
        return;
      }

      const userInteracting = (useChatEffects as any).__userInteractingRef as { current?: boolean } | undefined;

      const chatChanged = prevChatIdRef.current !== chatId;
      const prevLen = prevMessagesLenRef.current;
      const newLen = messages?.length ?? 0;

      if (chatChanged) {
        endRef.current?.scrollIntoView({ behavior: "smooth" });
        prevChatIdRef.current = chatId ?? null;
        prevMessagesLenRef.current = newLen;
        return;
      }

      if (userInteracting && userInteracting.current) {
        prevMessagesLenRef.current = newLen;
        return;
      }

      const gap = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
      const atBottom = gap <= 60; 

      if (prevLen === null) {
        endRef.current?.scrollIntoView({ behavior: "smooth" });
        prevMessagesLenRef.current = newLen;
        return;
      }

      if (newLen > prevLen && atBottom) {
        endRef.current?.scrollIntoView({ behavior: "smooth" });
      }

      prevMessagesLenRef.current = newLen;
    } catch (e) {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
      prevMessagesLenRef.current = messages?.length ?? 0;
      prevChatIdRef.current = chatId ?? null;
    }
  }, [messages?.length, chatId, scrollRootRef, endRef]);

  useEffect(() => {
    const root = scrollRootRef.current;
    if (!root) return;
    const viewport = root.querySelector('[data-slot="scroll-area-viewport"]') as HTMLDivElement | null;
    if (!viewport) return;
    let interactionTimeout: any = null;
    const userInteractingRef = { current: false };
    (useChatEffects as any).__userInteractingRef = userInteractingRef;

    const handler = () => {
      const gap = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
      setShowScrollToBottom(gap > 120);
    };

    const startInteraction = () => {
      userInteractingRef.current = true;
      if (interactionTimeout) clearTimeout(interactionTimeout);
      interactionTimeout = setTimeout(() => { userInteractingRef.current = false; }, 1200);
    };

    viewport.addEventListener("scroll", handler);
    viewport.addEventListener("pointerdown", startInteraction);
    viewport.addEventListener("wheel", startInteraction, { passive: true } as any);
    handler();
    return () => {
      viewport.removeEventListener("scroll", handler);
      viewport.removeEventListener("pointerdown", startInteraction);
      viewport.removeEventListener("wheel", startInteraction as EventListener);
      if (interactionTimeout) clearTimeout(interactionTimeout);
      try { delete (useChatEffects as any).__userInteractingRef; } catch {}
    };
  }, [scrollRootRef, setShowScrollToBottom]);

  useEffect(() => {
    const init = async () => {
      try {
        let uid = localStorage.getItem("myfin_userId");
        if (!uid) {
          uid = `u_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
          localStorage.setItem("myfin_userId", uid);
        }
        userIdRef.current = uid;
        const uname = localStorage.getItem("myfin_userName") || "Invitado";
        state.userNameRef.current = uname;

        let stored = localStorage.getItem("activeChatId");
        if (!stored) {
          if (history && typeof history.createNewConversation === "function") {
            await history.createNewConversation();
            stored = localStorage.getItem("activeChatId") || state.chatId;
          }
        } else {
          state.setChatId(stored);
          try {
            if (history && typeof history.refreshChats === "function") await history.refreshChats();
          } catch {}
          try {
            if (history && typeof history.loadChatMessages === "function") await history.loadChatMessages(stored);
          } catch (e) {
            setMessages([{ id: 1, sender: "ai", text: history?.findResponse?.('') ?? '', timestamp: new Date() }]);
          }
        }
      } catch (e) {
        setMessages([{ id: 1, sender: "ai", text: history?.findResponse?.('') ?? '', timestamp: new Date() }]);
      } finally {
        setLoadingChat(false);
      }
    };
    init();
  }, [history, setLoadingChat, setMessages, userIdRef]);
}