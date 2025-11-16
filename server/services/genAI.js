import { FINANCE_SYSTEM_PROMPT } from '../utils/helpers.js';

export async function callGemini(prompt, history = []) {
  const apiKey = process.env.GOOGLE_GENAI_API_KEY;
  if (!apiKey) throw new Error('Missing GOOGLE_GENAI_API_KEY');

  const preferredModel = (process.env.GENAI_MODEL || 'gemini-2.5-flash').replace(/^models\//, '');
  const fallbackModel = 'gemini-1.5-flash';

  const tryOnce = async (modelName) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const partsFromHistory = (history || []).map((m) => ({
      role: m.role === 'model' || m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.text ?? '' }],
    }));

    const contents = [
      { role: 'user', parts: [{ text: FINANCE_SYSTEM_PROMPT }] },
      ...partsFromHistory,
      { role: 'user', parts: [{ text: String(prompt || '').trim() }] },
    ];

    const maxTokens = Number(process.env.GENAI_MAX_OUTPUT_TOKENS || 2048);
    const generationConfig = {
      temperature: 0.7,
      topP: 0.9,
      topK: 40,
      maxOutputTokens: isNaN(maxTokens) ? 2048 : Math.max(256, Math.min(maxTokens, 4096)),
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents, generationConfig }),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(`GenAI HTTP ${res.status}`);
      err.details = json;
      throw err;
    }

    let text = '';
    try {
      text = json?.candidates?.[0]?.content?.parts?.map((p) => p?.text || '').join('\n').trim();
    } catch {}
    if (!text) text = json?.output || json?.candidates?.[0]?.output || '';

    if (text) {
      text = text
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/\*(.+?)\*/g, '$1')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
      text = text.replace(/^Estimado\b.*?\n?/i, '').replace(/^Hola\s+Estimado/i, 'Hola');
    }
    return text || '';
  };

  try {
    return await tryOnce(preferredModel);
  } catch (e) {
    const status = e?.details?.error?.code || e?.details?.code || 0;
    if (status === 404 || /NOT_FOUND/i.test(JSON.stringify(e?.details))) {
      try {
        return await tryOnce(fallbackModel);
      } catch (e2) {
        throw e2;
      }
    }
    throw e;
  }
}

export default callGemini;
