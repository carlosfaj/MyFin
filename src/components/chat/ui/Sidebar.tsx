import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { ScrollArea } from "../../ui/scroll-area";
import { Tooltip, TooltipTrigger, TooltipContent } from "../../ui/tooltip";
import { Check, Plus, Trash2 } from "lucide-react";

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
  if (t.length <= 12) return t;
  const words = t.split(/\s+/).filter(Boolean);
  const acronym = words.map((w) => w[0]).join("").toUpperCase();
  if (acronym.length > 0 && acronym.length <= 6) return acronym;
  const noVowels = t.replace(/[aeiouáéíóúAEIOUÁÉÍÓÚ]/g, "").replace(/[^\w]/g, "");
  if (noVowels.length > 0 && noVowels.length <= 10) return noVowels;
  return t.slice(0, 10).replace(/\s+$/g, "") + "…";
}

export default function Sidebar({
  chats,
  chatId,
  selectChat,
  createNewChat,
  deleteChat,
}: {
  chats: any[];
  chatId: string | null;
  selectChat: (c: any) => Promise<void> | void;
  createNewChat: () => Promise<void> | void;
  deleteChat: (c: any) => Promise<void> | void;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageTitleIcon />
          <CardTitle>Conversaciones</CardTitle>
        </div>
        <Button size="sm" variant="outline" onClick={() => createNewChat()}>
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
                        onClick={async () => await selectChat(c)}
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
                    onClick={async () => await deleteChat(c)}
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
  );
}

function MessageTitleIcon() {
  // lightweight inline icon to avoid importing MessageSquare
  return (
    <svg className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
