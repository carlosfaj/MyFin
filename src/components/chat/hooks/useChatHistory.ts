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
      const url = `http://localhost:4000/api/chats/${id}/messages`;
      const msgsResp = await fetch(url, { signal: controller.signal });
      if (!msgsResp.ok) {
        let bodyText = '';
        try { bodyText = await msgsResp.text(); } catch (_) {}
        console.error('[API] GET', url, 'status=', msgsResp.status, 'body=', String(bodyText).slice(0,200));
      }
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
      const url = `http://localhost:4000/api/chats?userId=${encodeURIComponent(userIdRef.current)}`;
      const listResp = await fetch(url);
      if (!listResp.ok) {
        let bodyText = '';
        try { bodyText = await listResp.text(); } catch (_) {}
        console.error('[API] GET', url, 'status=', listResp.status, 'body=', String(bodyText).slice(0,200));
      }
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
      const url = "http://localhost:4000/api/chats";
      const resp = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: "Nueva conversación", userId: userIdRef.current, userName: state.userNameRef.current }) });
      if (!resp.ok) {
        let bodyText = '';
        try { bodyText = await resp.text(); } catch (_) {}
        console.error('[API] POST', url, 'status=', resp.status, 'body=', String(bodyText).slice(0,200));
        throw new Error("No se pudo crear chat");
      }
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
      const url = `http://localhost:4000/api/chats/${c._id}`;
      const resp = await fetch(url, { method: 'DELETE' });
      let respJson = null;
      try { respJson = await resp.json(); } catch {}
      console.debug('[chat] delete response', c._id, resp.status, respJson);
      if (!resp.ok) {
        console.error('[API] DELETE', url, 'status=', resp.status, 'body=', JSON.stringify(respJson).slice(0,200));
      }
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
        const url = `http://localhost:4000/api/chats/${state.chatId}`;
        const _patchResp = await fetch(url, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userName: name }) });
        if (!_patchResp.ok) {
          let bodyText = '';
          try { bodyText = await _patchResp.text(); } catch (_) {}
          console.error('[API] PATCH', url, 'status=', _patchResp.status, 'body=', String(bodyText).slice(0,200));
        }
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