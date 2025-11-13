import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { MongoClient, ObjectId } from 'mongodb';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const PORT = process.env.PORT || 4000;

const {
  MONGODB_URI,
  MONGO_DB,
  MONGO_COLLECTION_CHATS,
  MONGO_COLLECTION_MESSAGES,
  MONGO_COLLECTION_USERS,
  MONGO_COLLECTION_SUGERENCIAS
} = process.env;

let mongoClient;
let db;
let colChats;
let colMessages;
let colUsuarios;
let colSugerencias;

async function initMongo() {
  if (!MONGODB_URI) {
    console.warn('MONGODB_URI no definido. Persistencia deshabilitada.');
    return;
  }
  mongoClient = new MongoClient(MONGODB_URI, { ignoreUndefined: true });
  await mongoClient.connect();
  db = mongoClient.db(MONGO_DB || 'MyFin');
  colChats = db.collection(MONGO_COLLECTION_CHATS || 'Chats');
  colMessages = db.collection(MONGO_COLLECTION_MESSAGES || 'Mensajes');
  colUsuarios = db.collection(MONGO_COLLECTION_USERS || 'Usuarios');
  colSugerencias = db.collection(MONGO_COLLECTION_SUGERENCIAS || 'Sugerencias');

  await Promise.all([
    colChats.createIndex({ userId: 1, updatedAt: -1 }),
    colMessages.createIndex({ chatId: 1, createdAt: -1 }),
    colMessages.createIndex({ sender: 1 }),
  ]).catch(e => console.warn('Fallo creando índices Mongo:', e.message));
  console.log('MongoDB conectado:', db.databaseName);
}

function isGenericTitle(title) {
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

function deriveTitleFrom(text) {
  try {
    let t = String(text || '').replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
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

const FINANCE_SYSTEM_PROMPT =
  process.env.FINANCE_SYSTEM_PROMPT ||
  'Estilo: cercano, natural y breve (máx ~6 líneas). Saluda por el nombre si el usuario lo comparte. Evita trato formal excesivo. Si la intención no es clara, haz 1 pregunta para precisar. Da respuestas prácticas y puntuales; sin asteriscos. Advierte riesgos con lenguaje simple.';

async function callGemini(prompt, history = []) {
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

app.get('/api/health', async (req, res) => {
  res.json({
    ok: true,
    model: process.env.GENAI_MODEL || 'gemini-2.5-flash',
    mongo: !!db,
    db: db?.databaseName || null
  });
});

app.post('/api/chats', async (req, res) => {
  try {
    if (!colChats) return res.status(503).json({ error: 'Mongo no inicializado' });
    const { title, userId, userName } = req.body || {};
    const now = new Date();
    const doc = {
      title: title || 'Nuevo chat',
      userId: userId || 'anon',
      userName: userName || null,
      createdAt: now,
      updatedAt: now
    };
    const result = await colChats.insertOne(doc);
    res.json({ _id: result.insertedId, ...doc });
  } catch (e) {
    res.status(500).json({ error: 'Error creando chat', details: e.message });
  }
});

app.get('/api/chats', async (req, res) => {
  try {
    if (!colChats) return res.status(503).json({ error: 'Mongo no inicializado' });
    const { userId } = req.query;
    const filter = userId ? { userId } : {};
    const chats = await colChats.find(filter).sort({ updatedAt: -1 }).limit(100).toArray();
    res.json(chats);
  } catch (e) {
    res.status(500).json({ error: 'Error listando chats', details: e.message });
  }
});

app.get('/api/chats/:id/messages', async (req, res) => {
  try {
    if (!colMessages) return res.status(503).json({ error: 'Mongo no inicializado' });
    const { id } = req.params;
    if (!ObjectId.isValid(id)) return res.status(400).json({ error: 'ID inválido' });
    const msgs = await colMessages.find({ chatId: new ObjectId(id) }).sort({ createdAt: 1 }).limit(1000).toArray();
    res.json(msgs);
  } catch (e) {
    res.status(500).json({ error: 'Error obteniendo mensajes', details: e.message });
  }
});

app.delete('/api/chats/:id', async (req, res) => {
  try {
    if (!colChats || !colMessages) return res.status(503).json({ error: 'Mongo no inicializado' });
    const { id } = req.params;
    if (!ObjectId.isValid(id)) return res.status(400).json({ error: 'ID inválido' });
    const chatObjectId = new ObjectId(id);
    const delChat = await colChats.deleteOne({ _id: chatObjectId });
    const delMsgs = await colMessages.deleteMany({ chatId: chatObjectId });
    res.json({ ok: true, deletedChat: delChat.deletedCount || 0, deletedMessages: delMsgs.deletedCount || 0 });
  } catch (e) {
    res.status(500).json({ error: 'Error eliminando chat', details: e.message });
  }
});

app.patch('/api/chats/:id', async (req, res) => {
  try {
    if (!colChats) return res.status(503).json({ error: 'Mongo no inicializado' });
    const { id } = req.params;
    if (!ObjectId.isValid(id)) return res.status(400).json({ error: 'ID inválido' });
    const { title, userName } = req.body || {};
    const update = {};
    if (typeof title === 'string' && title.trim()) update.title = title.trim().slice(0, 120);
    if (typeof userName === 'string' && userName.trim()) update.userName = userName.trim().slice(0, 60);
    if (!Object.keys(update).length) return res.status(400).json({ error: 'Nada que actualizar' });
    update.updatedAt = new Date();
    await colChats.updateOne({ _id: new ObjectId(id) }, { $set: update });
    const chat = await colChats.findOne({ _id: new ObjectId(id) });
    res.json(chat);
  } catch (e) {
    res.status(500).json({ error: 'Error actualizando chat', details: e.message });
  }
});

app.post('/api/message', async (req, res) => {
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

app.post('/api/chats/:id/messages', async (req, res) => {
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
      userId: userId || chat.userId || 'anon'
    };
    await colMessages.insertOne(userMsg);

    const historyDocs = await colMessages
      .find({ chatId: chatObjectId })
      .sort({ createdAt: -1 })
      .limit(40)
      .toArray();
    const ordered = historyDocs.reverse();
    const persona = chat.userName ? [{ role: 'user', text: `Mi nombre es ${chat.userName}.` }] : [];
    const historyForModel = [...persona, ...ordered.map(m => ({
      role: m.sender === 'ai' ? 'model' : 'user',
      text: m.text
    }))];
    let aiText;
    try {
      aiText = await callGemini(cleanPrompt, historyForModel);
    } catch (e) {
      aiText = 'No se pudo generar respuesta ahora.';
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

initMongo()
  .catch(e => console.error('Error conectando a MongoDB:', e.message))
  .finally(() => {
    app.listen(PORT, () => {
      console.log(`Servidor escuchando en http://localhost:${PORT}`);
    });
  });