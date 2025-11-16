export function isGenericTitle(title) {
  if (!title) return true;
  const t = String(title).trim().toLowerCase();
  return (
    t === 'nuevo chat' ||
    t === 'chat' ||
    t === 'nueva conversación' ||
    t === 'asistente financiero' ||
    t === 'asistente financiero ia'
  );
}

export function deriveTitleFrom(text) {
  try {
    let t = String(text || '').replace(/([\r\n])+/, ' ').replace(/\s+/g, ' ').trim();
    t = t.replace(/^[-*#>\s]+/, '').replace(/\*\*|__/g, '');
    const words = t.split(/\s+/).filter(Boolean);
    let candidate = words.slice(0, 8).join(' ');
    candidate = candidate.replace(/[\s.,;:!?¡¿]+$/, '');
    if (candidate) candidate = candidate.charAt(0).toUpperCase() + candidate.slice(1);
    if (words.length > 8) candidate = `${candidate}…`;
    if (candidate.length > 80) candidate = candidate.slice(0, 77).replace(/[\s.,;:!?]+$/, '') + '…';
    return candidate || 'Nuevo chat';
  } catch {
    return 'Nuevo chat';
  }
}

export const FINANCE_SYSTEM_PROMPT =
  process.env.FINANCE_SYSTEM_PROMPT ||
  'Estilo: cercano, natural y breve (máx ~6 líneas). Saluda por el nombre si el usuario lo comparte. Evita trato formal excesivo. Si la intención no es clara, haz 1 pregunta para precisar. Da respuestas prácticas y puntuales; sin asteriscos. Advierte riesgos con lenguaje simple.';
