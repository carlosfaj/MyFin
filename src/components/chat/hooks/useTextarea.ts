import { useCallback } from "react";

export function useTextarea(state: ReturnType<typeof import('./useChatState').useChatState>) {
  const adjustTextareaHeight = useCallback((el?: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(300, el.scrollHeight)}px`;
  }, []);

  const restoreCaretPosition = (el?: HTMLTextAreaElement | null, pos?: number) => {
    if (!el || typeof pos !== 'number') return;
    try { el.setSelectionRange(pos, pos); el.focus(); } catch {}
  };

  const handleInputChange = (setter: (v:string)=>void) => (e: any) => {
    setter(e.target.value);
    adjustTextareaHeight(e.target);
  };

  const handleKeyDown = (onSend: ()=>void) => (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return { adjustTextareaHeight, restoreCaretPosition, handleInputChange, handleKeyDown };
}
