import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Send, Bot, User, Lightbulb, MessageSquare, Plus, Copy, Check, Trash2 } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "./ui/tooltip";

interface Message {
  id: number;
  sender: "user" | "ai";
  text: string;
  timestamp: Date;
}

const suggestedQuestions = [
  "¿Qué es la razón corriente?",
  "¿Cómo puedo mejorar mi rentabilidad?",
  "Explica el análisis vertical",
  "¿Mi nivel de endeudamiento es saludable?",
];

const aiResponses: { [key: string]: string } = {
  default:
    "Soy tu asistente financiero con IA. Puedo ayudarte a entender conceptos financieros, analizar tus ratios y sugerir mejoras. ¿En qué puedo asistirte hoy?",
  "razón corriente":
    "La razón corriente mide tu capacidad para pagar deudas a corto plazo. Se calcula dividiendo activos corrientes entre pasivos corrientes. Un valor entre 2.0 y 3.0 es ideal.",
  rentabilidad:
    "Para mejorar la rentabilidad, te sugiero: 1) Reducir costos operativos sin afectar calidad, 2) Aumentar el margen de productos premium, 3) Optimizar la rotación de inventario.",
  "análisis vertical":
    "El análisis vertical muestra la proporción de cada partida respecto al total. Te ayuda a identificar partidas que consumen muchos recursos.",
  endeudamiento:
    "Tu nivel de endeudamiento está en zona de precaución. Recomendado: priorizar pago de pasivos y evitar nuevas deudas si no es necesario.",
};

function isGenericTitleFront(title?: string | null) {
  if (!title) return true;
  const t = String(title).trim().toLowerCase();
  return (
    t === "nuevo chat" ||
    t === "chat" ||
    t === "nueva conversación" ||
    t === "asistente financiero" ||
    t === "asistente financiero ia"
  );
}

function compressTitle(title?: string | null) {
  if (!title) return "Chat";
  const t = String(title).trim();
  // If already short, return as-is
  if (t.length <= 12) return t;

  // Try acronym from the first letters of words (max 6 chars)
  const words = t.split(/\s+/).filter(Boolean);
  const acronym = words.map((w) => w[0]).join("").toUpperCase();
  if (acronym.length > 0 && acronym.length <= 6) return acronym;

  // Remove vowels to compress (keep alphanumerics)
  const noVowels = t.replace(/[aeiouáéíóúAEIOUÁÉÍÓÚ]/g, "").replace(/[^\w]/g, "");
  if (noVowels.length > 0 && noVowels.length <= 10) return noVowels;

  // Fallback: take first 10 chars (without trailing spaces) and add ellipsis
  return t.slice(0, 10).replace(/\s+$/g, "") + "…";
}

export function ChatAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatId, setChatId] = useState<string | null>(null);
  const [loadingChat, setLoadingChat] = useState(true);
  const [chats, setChats] = useState<any[]>([]);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [expandedIds, setExpandedIds] = useState<Record<number, boolean>>({});
  const userIdRef = useRef<string>("");
  const userNameRef = useRef<string>("");
  const [profileName, setProfileName] = useState<string>("");

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const MAX_AI_PREVIEW_CHARS = 700;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const scrollRootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = scrollRootRef.current;
    if (!root) return;
    const viewport = root.querySelector(
      '[data-slot="scroll-area-viewport"]'
    ) as HTMLDivElement | null;
    if (!viewport) return;
    const handler = () => {
      const gap = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
      setShowScrollToBottom(gap > 120);
    };
    viewport.addEventListener("scroll", handler);
    handler();
    return () => viewport.removeEventListener("scroll", handler);
  }, []);

  function findResponse(query: string) {
    const q = query.toLowerCase();
    if (q.includes("razón") || q.includes("corriente")) return aiResponses["razón corriente"];
    if (q.includes("rentab")) return aiResponses["rentabilidad"];
    if (q.includes("vertical")) return aiResponses["análisis vertical"];
    if (q.includes("endeud")) return aiResponses["endeudamiento"];
    return aiResponses.default;
  }

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
        userNameRef.current = uname;
  setProfileName(uname);

        let stored = localStorage.getItem("activeChatId");
        if (!stored) {
          const resp = await fetch("http://localhost:4000/api/chats", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: "Asistente Financiero", userId: uid, userName: uname }),
          });
            if (!resp.ok) throw new Error("No se pudo crear chat");
            const data = await resp.json();
            stored = String(data._id || "");
            if (stored) localStorage.setItem("activeChatId", stored);
        }
        setChatId(stored);
        try {
          const listResp = await fetch(`http://localhost:4000/api/chats?userId=${encodeURIComponent(userIdRef.current)}`);
          if (listResp.ok) {
            const list = await listResp.json();
            setChats(list);
          }
        } catch {}
        const msgsResp = await fetch(`http://localhost:4000/api/chats/${stored}/messages`);
        const list = msgsResp.ok ? await msgsResp.json() : [];
        const mapped: Message[] = list.map((m: any, idx: number) => ({
          id: idx + 1,
          sender: m.sender === "ai" ? "ai" : "user",
          text: m.text,
          timestamp: new Date(m.createdAt || Date.now()),
        }));
        if (mapped.length === 0) {
          mapped.push({
            id: 1,
            sender: "ai",
            text: aiResponses.default,
            timestamp: new Date(),
          });
        }
        setMessages(mapped);
      } catch (e) {
        setMessages([
          {
            id: 1,
            sender: "ai",
            text: aiResponses.default,
            timestamp: new Date(),
          },
        ]);
      } finally {
        setLoadingChat(false);
      }
    };
    init();
  }, []);

  const loadChatMessages = async (id: string) => {
    setLoadingChat(true);
    try {
      const msgsResp = await fetch(`http://localhost:4000/api/chats/${id}/messages`);
      const list = msgsResp.ok ? await msgsResp.json() : [];
      const mapped: Message[] = list.map((m: any, idx: number) => ({
        id: idx + 1,
        sender: m.sender === "ai" ? "ai" : "user",
        text: m.text,
        timestamp: new Date(m.createdAt || Date.now()),
      }));
      if (mapped.length === 0) {
        mapped.push({
          id: 1,
          sender: "ai",
          text: aiResponses.default,
          timestamp: new Date(),
        });
      }
      setMessages(mapped);
    } finally {
      setLoadingChat(false);
    }
  };

  const refreshChats = async () => {
    try {
  const listResp = await fetch(`http://localhost:4000/api/chats?userId=${encodeURIComponent(userIdRef.current)}`);
      if (listResp.ok) setChats(await listResp.json());
    } catch {}
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const m = input.match(/\b(?:soy|me llamo)\s+([A-Za-zÁÉÍÓÚáéíóúñÑ ]{2,30})\b/i);
    if (m && m[1] && chatId) {
      const name = m[1].trim().replace(/\s+/g, " ");
      userNameRef.current = name;
      localStorage.setItem("myfin_userName", name);
      fetch(`http://localhost:4000/api/chats/${chatId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userName: name }),
      }).catch(() => {});
    }
    const userMessage: Message = {
      id: messages.length + 1,
      sender: "user",
      text: input,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setSending(true);
    setErrorMsg(null);
    setIsStreaming(true);

    try {
      if (chatId) {
        const resp = await fetch(`http://localhost:4000/api/chats/${chatId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: input, userId: userIdRef.current }),
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();
        const aiText = data?.ai?.text || findResponse(input);
        const aiMessage: Message = {
          id: messages.length + 2,
          sender: "ai",
          text: aiText,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMessage]);
        refreshChats();
      } else {
        const aiMessage: Message = {
          id: messages.length + 2,
          sender: "ai",
          text: findResponse(input),
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMessage]);
      }
    } catch (e: any) {
      const aiText = findResponse(input);
      const aiMessage: Message = {
        id: messages.length + 2,
        sender: "ai",
        text: aiText,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      setErrorMsg(e?.message ? `Error de conexión (${e.message}). Usando respuesta simulada.` : "Error de conexión. Usando respuesta simulada.");
    } finally {
      setInput("");
      setSending(false);
      setIsStreaming(false);
    }
  };

  const handleQuestionClick = (question: string) => setInput(question);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Asistente Financiero IA</h1>
        <p className="text-muted-foreground">Haz tus preguntas sobre ratios, análisis de tendencias y consejos prácticos para tus finanzas.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="min-h-[420px] h-[70vh] md:h-[75vh] flex flex-col">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                <CardTitle>Finny</CardTitle>
              </div>
              <CardDescription>
                {loadingChat ? "Cargando conversación..." : chatId ? "Conversación activa" : "Modo local"}
              </CardDescription>
            </CardHeader>
            <CardContent className="relative flex-1 flex flex-col">
              <div ref={scrollRootRef} className="relative flex-1 flex flex-col">
                <ScrollArea className="flex-1 pr-4">
                  <div className="space-y-4 pb-20">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`group relative flex gap-3 ${message.sender === "user" ? "flex-row-reverse" : ""}`}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className={message.sender === "ai" ? "bg-primary text-white" : "bg-muted"}>
                          {message.sender === "ai" ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={`relative rounded-lg p-3 max-w-[80%] ${
                          message.sender === "user" ? "bg-primary text-white" : "bg-muted"
                        }`}
                      >
                        {(() => {
                          const isAI = message.sender === "ai";
                          const isLong = isAI && message.text.length > MAX_AI_PREVIEW_CHARS;
                          const isExpanded = !!expandedIds[message.id];
                          let displayText = message.text;
                          if (isAI && !isExpanded && isLong) {
                            const cut = message.text.slice(0, MAX_AI_PREVIEW_CHARS);
                            const lastSpace = cut.lastIndexOf(" ");
                            displayText = (lastSpace > 40 ? cut.slice(0, lastSpace) : cut).replace(/[\s.,;:!?¡¿-]+$/,"") + "…";
                          }
                          return (
                            <>
                              <p className="text-sm whitespace-pre-wrap break-words">{displayText}</p>
                              {isAI && isLong && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedIds((prev) => ({ ...prev, [message.id]: !isExpanded }))
                                  }
                                  className={`mt-1 text-[11px] underline-offset-2 hover:underline ${
                                    message.sender === "user" ? "text-white/80" : "text-primary"
                                  }`}
                                >
                                  {isExpanded ? "Menos" : "Más"}
                                </button>
                              )}
                            </>
                          );
                        })()}
                        <div
                          className={`mt-1 text-xs flex items-center gap-2 ${
                            message.sender === "user" ? "text-white/70" : "text-muted-foreground"
                          }`}
                        >
                          <span>
                            {message.timestamp.toLocaleTimeString("es-ES", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {message.sender === "ai" && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard?.writeText(message.text).then(() => {
                                      setCopiedId(message.id);
                                      setTimeout(() => setCopiedId(null), 1400);
                                    }).catch(() => {
                                      try {
                                        const ta = document.createElement('textarea');
                                        ta.value = message.text;
                                        document.body.appendChild(ta);
                                        ta.select();
                                        document.execCommand('copy');
                                        ta.remove();
                                        setCopiedId(message.id);
                                        setTimeout(() => setCopiedId(null), 1400);
                                      } catch {}
                                    });
                                  }}
                                  className={`p-0.5 rounded-md transition text-muted-foreground hover:text-foreground`}
                                  aria-label="Copiar mensaje"
                                >
                                  {copiedId === message.id ? (
                                    <Check className="h-4 w-4" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="bottom" sideOffset={10} className="text-xs text-gray-300">
                                {copiedId === message.id ? '¡Copiado!' : 'Copiar texto'}
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={endRef} />
                  {isStreaming && (
                    <div className="flex items-start gap-3 animate-pulse">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary text-white">
                          <Bot className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="rounded-lg p-3 bg-muted max-w-[80%]">
                        <p className="text-sm text-muted-foreground">Generando respuesta...</p>
                      </div>
                    </div>
                  )}
                  {errorMsg && (
                    <div className="text-xs text-red-600 dark:text-red-400 mt-2">
                      {errorMsg}
                    </div>
                  )}
                  </div>
                </ScrollArea>
                {showScrollToBottom && (
                  <div className="absolute bottom-20 right-6">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="shadow-md"
                      onClick={() => endRef.current?.scrollIntoView({ behavior: "smooth" })}
                    >
                      Bajar
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-4 pt-4 border-t">
                <Input
                  placeholder="Escribe tu pregunta aquí..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  className="rounded-lg"
                  disabled={sending}
                />
                <Button onClick={handleSend} size="icon" className="rounded-lg" disabled={sending}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                <CardTitle>Conversaciones</CardTitle>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  try {
                    const resp = await fetch("http://localhost:4000/api/chats", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ title: "Nueva conversación", userId: userIdRef.current, userName: userNameRef.current }),
                    });
                    if (!resp.ok) throw new Error("No se pudo crear chat");
                    const data = await resp.json();
                    const id = String(data._id || "");
                    if (id) {
                      localStorage.setItem("activeChatId", id);
                      setChatId(id);
                      await refreshChats();
                      await loadChatMessages(id);
                    }
                  } catch (e) {
                    setErrorMsg("No se pudo crear conversación.");
                  }
                }}
              >
                <Plus className="h-4 w-4 mr-1" /> Nuevo
              </Button>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[240px] pr-2">
                <div className="space-y-1">
                  {chats.length === 0 && (
                    <p className="text-sm text-muted-foreground">No hay conversaciones.</p>
                  )}
                  {chats.map((c: any) => {
                    const active = c._id === chatId;
                    return (
                      <div key={c._id} className="flex items-center gap-2 group">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant={active ? "secondary" : "ghost"}
                              className="flex-1 justify-start"
                              onClick={async () => {
                                const id = String(c._id);
                                localStorage.setItem("activeChatId", id);
                                setChatId(id);
                                await loadChatMessages(id);
                              }}
                            >
                              <span className="truncate flex items-center gap-2">
                                {compressTitle(c.title)}
                                {!isGenericTitleFront(c.title) && (
                                  <span className="inline-flex items-center text-green-600 dark:text-green-400" aria-label="Título fijado">
                                    <Check className="h-3.5 w-3.5" />
                                  </span>
                                )}
                              </span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="right" sideOffset={6} className="text-xs">
                            {c.title || "Chat"}
                          </TooltipContent>
                        </Tooltip>
                        <button
                          type="button"
                          aria-label="Eliminar conversación"
                          onClick={async () => {
                            const confirmDelete = window.confirm("¿Eliminar esta conversación? Esta acción no se puede deshacer.");
                            if (!confirmDelete) return;
                            try {
                              const resp = await fetch(`http://localhost:4000/api/chats/${c._id}`, { method: 'DELETE' });
                              if (resp.ok) {
                                if (c._id === chatId) {
                                  localStorage.removeItem('activeChatId');
                                  setChatId(null);
                                  setMessages([]);
                                }
                                await refreshChats();
                              } else {
                                setErrorMsg('No se pudo eliminar.');
                              }
                            } catch (e) {
                              setErrorMsg('Error eliminando conversación.');
                            }
                          }}
                          className="p-1 rounded-md cursor-pointer text-muted-foreground transition-colors duration-150 opacity-0 group-hover:opacity-100 focus:opacity-100 hover:text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="h-4 w-4 transition-colors group-hover:text-red-600 hover:text-red-600 focus:text-red-600" strokeWidth={1.8} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Perfil</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="Tu nombre"
                />
                <Button
                  variant="secondary"
                  disabled={!profileName.trim() || profileName.trim() === userNameRef.current}
                  onClick={async () => {
                    const name = profileName.trim().replace(/\s+/g, " ");
                    userNameRef.current = name;
                    localStorage.setItem("myfin_userName", name);
                    if (chatId) {
                      try {
                        await fetch(`http://localhost:4000/api/chats/${chatId}`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ userName: name }),
                        });
                        refreshChats();
                      } catch {}
                    }
                  }}
                >
                  Guardar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">El asistente usará este nombre en sus respuestas.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-warning" />
                <CardTitle>Preguntas Sugeridas</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {suggestedQuestions.map((question, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  className="w-full justify-start text-left h-auto py-3 rounded-lg"
                  onClick={() => handleQuestionClick(question)}
                >
                  {question}
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-primary/10 to-success/10">
            <CardHeader>
              <CardTitle className="text-sm">💡 Consejo del Día</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                El <strong>análisis de tendencias</strong> es más valioso que los números aislados. Observa cómo evolucionan tus ratios mes a mes para tomar decisiones informadas.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
