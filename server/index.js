import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { db } from './utils/mongo.js';
import { initMongo } from './utils/mongo.js';
import chatsRouter from './routes/chats.js';
import messagesRouter from './routes/messages.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const PORT = process.env.PORT || 4000;

app.get('/api/health', async (req, res) => {
  res.json({
    ok: true,
    model: process.env.GENAI_MODEL || 'gemini-2.5-flash',
    mongo: !!db,
    db: db?.databaseName || null,
  });
});

// Routers
app.use(chatsRouter);
app.use(messagesRouter);

initMongo()
  .catch((e) => console.error('Error conectando a MongoDB:', e.message))
  .finally(() => {
    app.listen(PORT, () => {
      console.log(`Servidor escuchando en http://localhost:${PORT}`);
    });
  });