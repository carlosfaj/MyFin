import express from 'express';
import { ObjectId } from 'mongodb';
import { colChats, colMessages } from '../utils/mongo.js';
import { isGenericTitle, deriveTitleFrom } from '../utils/helpers.js';

const router = express.Router();

router.post('/api/chats', async (req, res) => {
  try {
    if (!colChats) return res.status(503).json({ error: 'Mongo no inicializado' });
    const { title, userId, userName } = req.body || {};
    const now = new Date();
    const doc = {
      title: title || 'Nuevo chat',
      userId: userId || 'anon',
      userName: userName || null,
      createdAt: now,
      updatedAt: now,
    };
    const result = await colChats.insertOne(doc);
    res.json({ _id: result.insertedId, ...doc });
  } catch (e) {
    res.status(500).json({ error: 'Error creando chat', details: e.message });
  }
});

router.get('/api/chats', async (req, res) => {
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

router.get('/api/chats/:id/messages', async (req, res) => {
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

router.delete('/api/chats/:id', async (req, res) => {
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

router.patch('/api/chats/:id', async (req, res) => {
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

export default router;
