import { useCallback, useMemo } from "react";
import { Message } from "./useChatState";

export function useChatHistory(state: ReturnType<typeof import('./useChatState').useChatState>) {
  const {
    setLoadingChat,
    setMessages,
    setChats,
    setChatId,
    profileName,
    setProfileName,
    userIdRef,
  } = state as any;

  const loadChatMessages = useCallback(async (id: string) => {
    try { (loadChatMessages as any).__controller?.abort(); } catch {}
    const controller = new AbortController();
    (loadChatMessages as any).__controller = controller;
    const requestedId = id;
    (loadChatMessages as any).__latestRequestedId = requestedId;
    setLoadingChat(true);
    try {
      const msgsResp = await fetch(`http://localhost:4000/api/chats/${id}/messages`, { signal: controller.signal });
      const list = msgsResp.ok ? await msgsResp.json() : [];
      const mapped: Message[] = list.map((m: any, idx: number) => ({ id: idx + 1, sender: m.sender === "ai" ? "ai" : "user", text: m.text, timestamp: new Date(m.createdAt || Date.now()) }));
      if (mapped.length === 0) mapped.push({ id: 1, sender: "ai", text: "Hola, soy Finny, tu asistente financiero. ¿En qué puedo ayudarte hoy?", timestamp: new Date() } as any);
      if ((loadChatMessages as any).__latestRequestedId === requestedId) {
        setMessages(mapped);
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') {
      } else {
        if ((loadChatMessages as any).__latestRequestedId === requestedId) {
          setMessages([{ id: 1, sender: "ai", text: 'Hola, soy Finny, tu asistente financiero. ¿En qué puedo ayudarte hoy?', timestamp: new Date() }] as any);
        }
      }
    } finally {
      if ((loadChatMessages as any).__latestRequestedId === requestedId) {
        setLoadingChat(false);
      }
    }
  }, [setLoadingChat, setMessages]);

  const refreshChats = useCallback(async () => {
    try {
      const listResp = await fetch(`http://localhost:4000/api/chats?userId=${encodeURIComponent(userIdRef.current)}`);
      const data = listResp.ok ? await listResp.json() : [];
      setChats(data);
      return data;
    } catch {
      return [];
    }
  }, [userIdRef, setChats]);

  const createNewConversation = useCallback(async () => {
    if ((createNewConversation as any).__creating) return;
    (createNewConversation as any).__creating = true;
    setLoadingChat(true);
    try {
      const resp = await fetch("http://localhost:4000/api/chats", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: "Nueva conversación", userId: userIdRef.current, userName: state.userNameRef.current }) });
      if (!resp.ok) throw new Error("No se pudo crear chat");
      const data = await resp.json();
      const id = String(data._id || "");
      if (id) {
        localStorage.setItem("activeChatId", id);
        setChatId(id);
        await refreshChats();
        await loadChatMessages(id);
        return id;
      }
    } catch (e) {
      state.setErrorMsg("No se pudo crear conversación.");
    } finally {
      (createNewConversation as any).__creating = false;
      setLoadingChat(false);
    }
  }, [userIdRef, state.userNameRef, setLoadingChat, refreshChats, loadChatMessages, setChatId]);

  const selectChat = useCallback(async (c: any) => {
    const id = String(c._id);
    localStorage.setItem("activeChatId", id);
    state.setChatId(id);
    await loadChatMessages(id);
  }, [loadChatMessages, setChatId]);

  const deleteChat = useCallback(async (c: any) => {
    const confirmDelete = window.confirm("¿Eliminar esta conversación? Esta acción no se puede deshacer.");
    if (!confirmDelete) return;
    try {
      const resp = await fetch(`http://localhost:4000/api/chats/${c._id}`, { method: 'DELETE' });
      let respJson = null;
      try { respJson = await resp.json(); } catch {}
      console.debug('[chat] delete response', c._id, resp.status, respJson);
      if (resp.ok) {
        const updated = await refreshChats();
        if (c._id === state.chatId) {
          if (updated && updated.length > 0) {
            const next = updated[0];
            const nextId = String(next._id);
            localStorage.setItem('activeChatId', nextId);
            state.setChatId(nextId);
            await loadChatMessages(nextId);
          } else {
            localStorage.removeItem('activeChatId');
            localStorage.removeItem('myfin_userName');
            state.setChatId(null);
            state.setMessages([]);
            try { if (typeof setProfileName === 'function') setProfileName(''); } catch {}
            try { state.userNameRef.current = ''; } catch {}
          }
        }
      } else state.setErrorMsg('No se pudo eliminar.');
    } catch (e) { state.setErrorMsg('Error eliminando conversación.'); }
  }, [refreshChats, loadChatMessages, setChatId, setMessages]);

  const saveProfileName = useCallback(async (nameArg?: string) => {
    const raw = typeof nameArg === 'string' ? nameArg : profileName;
    const name = String(raw || "").trim().replace(/\s+/g, " ");
    if (!name) return;
    setProfileName(name);
    state.userNameRef.current = name;
    localStorage.setItem("myfin_userName", name);
    if (state.chatId) {
      try {
        await fetch(`http://localhost:4000/api/chats/${state.chatId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userName: name }) });
        await refreshChats();
        state.setErrorMsg(null);
        return true;
      } catch {}
    }
    state.setErrorMsg(null);
    return true;
  }, [profileName, state.userNameRef, state.chatId, refreshChats]);
  const api = useMemo(() => ({
    loadChatMessages,
    refreshChats,
    createNewConversation,
    selectChat,
    deleteChat,
    saveProfileName,
  }), [loadChatMessages, refreshChats, createNewConversation, selectChat, deleteChat, saveProfileName]);

  return api;
}