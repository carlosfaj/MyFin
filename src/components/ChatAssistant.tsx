import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { Bot, Lightbulb } from "lucide-react";

import MessageBubble from "./chat/ui/MessageBubble";
import LoadingBubble from "./chat/ui/LoadingBubble";
import Sidebar from "./chat/ui/Sidebar";
import InputArea from "./chat/ui/InputArea";

import { useChatState } from "./chat/hooks/useChatState";
import { useChatHistory } from "./chat/hooks/useChatHistory";
import { useChatActions } from "./chat/hooks/useChatActions";
import { useChatEffects } from "./chat/hooks/useChatEffects";
import { useChatSettings } from "./chat/hooks/useChatSettings";
import { useTextarea } from "./chat/hooks/useTextarea";

const suggestedQuestions = [
  "¿Qué es la razón corriente?",
  "¿Cómo puedo mejorar mi rentabilidad?",
  "Explica el análisis vertical",
  "¿Mi nivel de endeudamiento es saludable?",
];

export function ChatAssistant() {
  const state = useChatState();
  const history = useChatHistory(state);
  const actions = useChatActions(state, history);
  useChatEffects(state, history);
  useChatSettings(state);
  useTextarea(state);

  const {
    messages,
    chatId,
    loadingChat,
    chats,
    expandedIds,
    setExpandedIds,
    userIdRef,
    // profileName,
    // setProfileName,
    input,
    setInput,
    sending,
    showScrollToBottom,
    errorMsg,
    isStreaming,
    endRef,
    scrollRootRef,
    MAX_AI_PREVIEW_CHARS,
  } = state as any;

  const { handleSend, copyMessageText, handleQuestionClick } = actions as any;
  const { loadChatMessages, refreshChats, createNewConversation, selectChat, deleteChat } = history as any;

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
                    {messages.map((message: any) => (
                      <MessageBubble
                        key={message.id}
                        message={message}
                        onCopy={(m: any) => copyMessageText(m)}
                        isExpanded={!!expandedIds[message.id]}
                        toggleExpand={() => setExpandedIds((prev: any) => ({ ...prev, [message.id]: !prev[message.id] }))}
                        MAX_AI_PREVIEW_CHARS={MAX_AI_PREVIEW_CHARS}
                      />
                    ))}
                    <div ref={endRef} />
                    {isStreaming && <LoadingBubble />}
                    {errorMsg && <div className="text-xs text-red-600 dark:text-red-400 mt-2">{errorMsg}</div>}
                  </div>
                </ScrollArea>
                {showScrollToBottom && (
                  <div className="absolute bottom-20 right-6">
                    <button type="button" className="rounded-md bg-secondary px-3 py-1 text-sm shadow" onClick={() => endRef.current?.scrollIntoView({ behavior: "smooth" })}>
                      Bajar
                    </button>
                  </div>
                )}
              </div>

              <InputArea input={input} setInput={setInput} handleSend={() => handleSend()} sending={sending} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Sidebar chats={chats} chatId={chatId} selectChat={selectChat} createNewChat={createNewConversation} deleteChat={deleteChat} />
          {/* Perfil eliminado por petición del usuario */}

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-warning" />
                <CardTitle>Preguntas Sugeridas</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {suggestedQuestions.map((question, idx) => (
                <button
                  key={idx}
                  className="w-full text-left h-auto py-3 rounded-lg border border-border hover:bg-muted/50"
                  onClick={() => handleQuestionClick(question)}
                >
                  {question}
                </button>
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