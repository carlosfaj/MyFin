import React from 'react';
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import { Send } from "lucide-react";

export default function InputArea({
  input,
  setInput,
  handleSend,
  sending,
}: {
  input: string;
  setInput: (v: string) => void;
  handleSend: (value?: string) => Promise<void> | void;
  sending: boolean;
}) {
  return (
    <div className="flex gap-2 mt-4 pt-4 border-t">
      <Input
        placeholder="Escribe tu pregunta aquí..."
        value={input}
        onChange={(e) => setInput((e.target as HTMLInputElement).value)}
        onKeyDown={(e) => { if ((e as React.KeyboardEvent).key === 'Enter') { e.preventDefault(); handleSend(); } }}
        className="rounded-lg"
        disabled={sending}
      />
      <Button onClick={() => handleSend()} size="icon" className="rounded-lg" disabled={sending}>
        <Send className="h-4 w-4" />
      </Button>
    </div>
  );
}
