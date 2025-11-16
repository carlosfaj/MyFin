import React from 'react';
import { Avatar, AvatarFallback } from "../../ui/avatar";
import { Bot } from "lucide-react";

export default function LoadingBubble(){
  return (
    <div className="flex items-start gap-3 animate-pulse">
      <Avatar className="h-8 w-8">
        <AvatarFallback className="bg-primary text-white"><Bot className="h-4 w-4" /></AvatarFallback>
      </Avatar>
      <div className="rounded-lg p-3 bg-muted max-w-[80%]"><p className="text-sm text-muted-foreground">Generando respuesta...</p></div>
    </div>
  );
}
