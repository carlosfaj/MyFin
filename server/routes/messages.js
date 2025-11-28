import express from 'express';
import { ObjectId } from 'mongodb';
import { colChats, colMessages } from '../utils/mongo.js';
import { isGenericTitle, deriveTitleFrom } from '../utils/helpers.js';
import callGemini from '../services/genAI.js';

const router = express.Router();

router.post('/api/message', async (req, res) => {
  try {
    if (String(process.env.FORCE_FAKE_AI || 'false').toLowerCase() === 'true') {
      return res.json({ text: 'Respuesta simulada (FORCE_FAKE_AI=true). Desactiva para usar Gemini.' });
    }
    const { prompt, history } = req.body || {};
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Missing prompt' });
    }
    const text = await callGemini(prompt, Array.isArray(history) ? history : []);
    return res.json({ text });
  } catch (err) {
    console.error('Gemini error:', err?.details || err?.message || err);
    return res.status(500).json({ error: 'GenAI failed', details: err?.details || err?.message || String(err) });
  }
});

router.post('/api/chats/:id/messages', async (req, res) => {
  try {
    if (!colMessages || !colChats) return res.status(503).json({ error: 'Mongo no inicializado' });
    const { id } = req.params;
    if (!ObjectId.isValid(id)) return res.status(400).json({ error: 'ID inválido' });
    const { prompt, userId } = req.body || {};
    if (!prompt || typeof prompt !== 'string') return res.status(400).json({ error: 'Missing prompt' });
    const cleanPrompt = String(prompt)
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, ' ')
      .slice(0, 2000)
      .trim();
    if (!cleanPrompt) return res.status(400).json({ error: 'Prompt vacío tras sanitizar' });

    const chatObjectId = new ObjectId(id);
    const chat = await colChats.findOne({ _id: chatObjectId });
    if (!chat) return res.status(404).json({ error: 'Chat no encontrado' });

    const createdAt = new Date();
    const countBefore = await colMessages.countDocuments({ chatId: chatObjectId });
    const userMsg = {
      chatId: chatObjectId,
      sender: 'user',
      text: cleanPrompt,
      createdAt,
      userId: userId || chat.userId || 'anon',
    };
    await colMessages.insertOne(userMsg);

    const historyDocs = await colMessages
      .find({ chatId: chatObjectId })
      .sort({ createdAt: -1 })
      .limit(40)
      .toArray();
    const ordered = historyDocs.reverse();

    // Obtener contexto financiero
    let financialContext = "";
    try {
      const { getFinancialRecords } = await import('../models/FinancialRecord.js');
      const { calculateRatios } = await import('../utils/financialCalculations.js');

      const records = await getFinancialRecords(userId || chat.userId || 'anon');
      if (records && records.length > 0) {
        // Agrupar y calcular
        const byPeriod = {};
        records.forEach(r => {
          if (!byPeriod[r.period]) byPeriod[r.period] = {};
          byPeriod[r.period][r.type] = r.data;
        });
        const periods = Object.keys(byPeriod).sort().reverse();
        const currentPeriod = periods[0];
        const analysis = calculateRatios(byPeriod[currentPeriod], periods[1] ? byPeriod[periods[1]] : null);

        financialContext = `
CONTEXTO FINANCIERO DEL USUARIO (Periodo ${currentPeriod}):
- Liquidez: Razón Corriente ${analysis.liquidez.razonCorriente.valor.toFixed(2)}
- Rentabilidad: Margen Neto ${analysis.rentabilidad.margenNeto.valor.toFixed(2)}%, ROE ${analysis.rentabilidad.roe.valor.toFixed(2)}%
- Endeudamiento: Nivel ${analysis.endeudamiento.nivelEndeudamiento.valor.toFixed(2)}%
- Actividad: Rotación Activos ${analysis.actividad.rotacionActivos.valor.toFixed(2)}
Usa estos datos para responder preguntas sobre su situación financiera.
`;
      }
    } catch (err) {
      console.error("Error inyectando contexto financiero:", err);
    }

    // Hacemos explícita la nota sobre el nombre del usuario para evitar que
    // el modelo lo interprete como su propia identidad.
    const persona = chat.userName
      ? [
        {
          role: 'user',
          text: `NOTA: El nombre del usuario es ${chat.userName}. No declares que tú te llamas ${chat.userName}. Saluda al usuario por su nombre.`,
        },
      ]
      : [];

    if (financialContext) {
      persona.push({ role: 'user', text: financialContext });
    }

    const historyForModel = [
      ...persona,
      ...ordered.map((m) => ({ role: m.sender === 'ai' ? 'model' : 'user', text: m.text })),
    ];
    let aiText;
    try {
      aiText = await callGemini(cleanPrompt, historyForModel);
    } catch (e) {
      aiText = 'No se pudo generar respuesta ahora.';
    }

    // Sanitizar respuesta: evitar que el modelo se identifique con el nombre del usuario
    if (chat.userName && typeof aiText === 'string') {
      const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const name = String(chat.userName).trim();
      if (name) {
        const rx = new RegExp(
          `(^|[\\s\\.,;:!¿\\?\\n])((yo\\s+soy|yo\\s+también\\s+soy|mi\\s+nombre\\s+es|me\\s+llamo)\\s+${escapeRegex(name)})([\\s\\.,;:!¿\\?\\n]|$)`,
          'i'
        );
        aiText = aiText.replace(rx, '');
        aiText = aiText.replace(/\n{3,}/g, '\n\n').trim();
        if (!aiText) aiText = 'No se pudo generar respuesta ahora.';
      }
    }
    const aiMsg = {
      chatId: chatObjectId,
      sender: 'ai',
      text: aiText,
      createdAt: new Date(),
    };
    await colMessages.insertOne(aiMsg);
    const setFields = { updatedAt: new Date() };
    if (countBefore === 0 && isGenericTitle(chat.title)) {
      setFields.title = deriveTitleFrom(cleanPrompt);
    }
    await colChats.updateOne({ _id: chatObjectId }, { $set: setFields });
    res.json({ user: userMsg, ai: aiMsg });
  } catch (e) {
    res.status(500).json({ error: 'Error enviando mensaje', details: e.message });
  }
});

export default router;
