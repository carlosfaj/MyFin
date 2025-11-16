import React from 'react';
import { Avatar, AvatarFallback } from "../../ui/avatar";
import { Bot, User, Copy } from "lucide-react";
import { Message } from "../hooks/useChatState";

export default function MessageBubble({ message, onCopy, isExpanded, toggleExpand, MAX_AI_PREVIEW_CHARS }: { message: Message; onCopy: (m: Message)=>void; isExpanded?: boolean; toggleExpand?: ()=>void; MAX_AI_PREVIEW_CHARS?: number }) {
  const isAI = message.sender === 'ai';
  const isLong = isAI && message.text.length > (MAX_AI_PREVIEW_CHARS ?? 700);
  let displayText = message.text;
  if (isAI && !isExpanded && isLong) {
    const cut = message.text.slice(0, MAX_AI_PREVIEW_CHARS ?? 700);
    const lastSpace = cut.lastIndexOf(' ');
    displayText = (lastSpace > 40 ? cut.slice(0, lastSpace) : cut).replace(/[\s.,;:!?¡¿-]+$/,'') + '…';
  }

  return (
    <div className={`group relative flex gap-3 ${message.sender === "user" ? "flex-row-reverse" : ""}`}>
      <Avatar className="h-8 w-8">
        <AvatarFallback className={message.sender === "ai" ? "bg-primary text-white" : "bg-muted"}>
          {message.sender === "ai" ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>

      <div className={`relative rounded-lg p-3 max-w-[80%] ${message.sender === "user" ? "bg-primary text-white" : "bg-muted"}`}>
        <p className="text-sm whitespace-pre-wrap break-words">{displayText}</p>
        {isAI && isLong && (
          <button type="button" onClick={toggleExpand} className={`mt-1 text-[11px] underline-offset-2 hover:underline ${message.sender === "user" ? "text-white/80" : "text-primary"}`}>
            {isExpanded ? "Menos" : "Más"}
          </button>
        )}

        <div className={`mt-1 text-xs flex items-center gap-2 ${message.sender === "user" ? "text-white/70" : "text-muted-foreground"}`}>
          <span>{message.timestamp.toLocaleTimeString('es-ES',{hour: '2-digit', minute: '2-digit'})}</span>
          {message.sender === 'ai' && (
            <button onClick={() => onCopy(message)} className="p-0.5 rounded-md transition text-muted-foreground hover:text-foreground" aria-label="Copiar mensaje">
              <Copy className='h-4 w-4' />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
