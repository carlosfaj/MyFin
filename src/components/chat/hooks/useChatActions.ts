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
        const resp = await fetch(`http://localhost:4000/api/chats/${chatId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: input, userId: state.userIdRef.current }),
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
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
    }).catch(() => {
      try {
        const ta = document.createElement('textarea');
        ta.value = message.text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
        state.setCopiedId(message.id);
        setTimeout(() => state.setCopiedId(null), 1400);
      } catch {}
    });
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