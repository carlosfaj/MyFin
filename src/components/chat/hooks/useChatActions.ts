import { Message } from "./useChatState";

export function useChatActions(state: ReturnType<typeof import('./useChatState').useChatState>, history: ReturnType<typeof import('./useChatHistory').useChatHistory>) {
  const {
    messages,
    setMessages,
    chatId,
    setInput,
    setSending,
    setErrorMsg,
    setIsStreaming,
    setCopiedId,
  } = state as any;

  function findResponse(query: string) {
    const q = query.toLowerCase();
    if (q.includes("razón") || q.includes("corriente")) return "La razón corriente mide tu capacidad para pagar deudas a corto plazo. Se calcula dividiendo activos corrientes entre pasivos corrientes. Un valor entre 2.0 y 3.0 es ideal.";
    if (q.includes("rentab")) return "Para mejorar la rentabilidad, te sugiero: 1) Reducir costos operativos sin afectar calidad, 2) Aumentar el margen de productos premium, 3) Optimizar la rotación de inventario.";
    if (q.includes("vertical")) return "El análisis vertical muestra la proporción de cada partida respecto al total. Te ayuda a identificar partidas que consumen muchos recursos.";
    if (q.includes("endeud")) return "Tu nivel de endeudamiento está en zona de precaución. Recomendado: priorizar pago de pasivos y evitar nuevas deudas si no es necesario.";
    return "Soy tu asistente financiero con IA. Puedo ayudarte a entender conceptos financieros, analizar tus ratios y sugerir mejoras. ¿En qué puedo asistirte hoy?";
  }

  const handleSend = async (inputValue?: string) => {
    const input = (typeof inputValue === 'string') ? inputValue : (state.input || '');
    if (!input.trim()) return;
    const m = input.match(/\b(?:soy|me llamo)\s+([A-Za-zÁÉÍÓÚáéíóúñÑ ]{2,30})\b/i);
    if (m && m[1] && chatId) {
      const name = m[1].trim().replace(/\s+/g, " ");
      state.userNameRef.current = name;
      localStorage.setItem("myfin_userName", name);
      fetch(`http://localhost:4000/api/chats/${chatId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userName: name }) }).catch(() => {});
    }

    const userMessage: Message = { id: messages.length + 1, sender: "user", text: input, timestamp: new Date() };
    setMessages((prev: Message[]) => [...prev, userMessage]);
    setSending(true);
    setErrorMsg(null);
    setIsStreaming(true);

    try {
      if (chatId) {
        // Validar que chatId aparenta ser un ObjectId (24 hex chars). Si no, crear nueva conversación.
        const oidRx = /^[a-fA-F0-9]{24}$/;
        let targetChatId = chatId;
        if (!oidRx.test(String(chatId))) {
          console.warn('[chat] chatId inválido:', chatId, 'intentando crear nueva conversación');
          try {
            const newId = await history.createNewConversation();
            if (newId) targetChatId = newId;
            else {
              console.warn('[chat] No se pudo crear nueva conversación; usando respuesta local.');
              const aiMessage: Message = { id: messages.length + 2, sender: "ai", text: findResponse(input), timestamp: new Date() };
              setMessages((prev: Message[]) => [...prev, aiMessage]);
              return;
            }
          } catch (err) {
            console.error('[chat] error creando conversación:', err);
            const aiMessage: Message = { id: messages.length + 2, sender: "ai", text: findResponse(input), timestamp: new Date() };
            setMessages((prev: Message[]) => [...prev, aiMessage]);
            return;
          }
        }

        const url = `http://localhost:4000/api/chats/${targetChatId}/messages`;
        let resp = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: input, userId: state.userIdRef.current }),
        });
        if (!resp.ok) {
          let bodyText = '';
          try { bodyText = await resp.text(); } catch (_) {}
          console.error('[API] POST', url, 'status=', resp.status, 'body=', String(bodyText).slice(0,200));
          // Si recibimos 404 (chat no encontrado), intentar crear nueva conversación y reenviar
          if (resp.status === 404) {
            console.warn('[chat] server returned 404; intentando crear nueva conversación y reenviar');
            try {
              const newId = await history.createNewConversation();
              if (newId && newId !== targetChatId) {
                const retryUrl = `http://localhost:4000/api/chats/${newId}/messages`;
                const retryResp = await fetch(retryUrl, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ prompt: input, userId: state.userIdRef.current }),
                });
                if (retryResp.ok) {
                  resp = retryResp;
                } else {
                  let rb = '';
                  try { rb = await retryResp.text(); } catch (_) {}
                  console.error('[chat] retry failed', retryUrl, retryResp.status, rb);
                  throw new Error(`HTTP ${retryResp.status}`);
                }
              }
            } catch (err) {
              console.error('[chat] error creando/reenviando:', err);
              throw err;
            }
          } else {
            throw new Error(`HTTP ${resp.status}`);
          }
        }
        const data = await resp.json();
        const aiText = data?.ai?.text || findResponse(input);
        const aiMessage: Message = { id: messages.length + 2, sender: "ai", text: aiText, timestamp: new Date() };
        setMessages((prev: Message[]) => [...prev, aiMessage]);
        history.refreshChats();
      } else {
        const aiMessage: Message = { id: messages.length + 2, sender: "ai", text: findResponse(input), timestamp: new Date() };
        setMessages((prev: Message[]) => [...prev, aiMessage]);
      }
    } catch (e: any) {
      const aiText = findResponse(input);
      const aiMessage: Message = { id: messages.length + 2, sender: "ai", text: aiText, timestamp: new Date() };
      setMessages((prev: Message[]) => [...prev, aiMessage]);
      setErrorMsg(e?.message ? `Error de conexión (${e.message}). Usando respuesta simulada.` : "Error de conexión. Usando respuesta simulada.");
    } finally {
      setInput("");
      setSending(false);
      setIsStreaming(false);
    }
  };

  const copyMessageText = (message: Message) => {
    navigator.clipboard?.writeText(message.text).then(() => {
      state.setCopiedId(message.id);
      setTimeout(() => state.setCopiedId(null), 1400);
    }).catch(() => {});
  };

  const handleQuestionClick = (question: string) => {
    state.setInput(question);
  };

  return {
    handleSend,
    copyMessageText,
    handleQuestionClick,
    findResponse,
  };
}