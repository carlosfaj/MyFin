import { MongoClient } from 'mongodb';

let mongoClient = null;
let db = null;
let colChats = null;
let colMessages = null;
let colUsuarios = null;
let colSugerencias = null;
let colBalanceGeneral = null;
let colEstadoResultados = null;

export async function initMongo() {
  const { MONGODB_URI, MONGO_DB, MONGO_COLLECTION_CHATS, MONGO_COLLECTION_MESSAGES, MONGO_COLLECTION_USERS, MONGO_COLLECTION_SUGERENCIAS } = process.env;
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
  colBalanceGeneral = db.collection('Balance_General');
  colEstadoResultados = db.collection('Estado_Resultado');

  await Promise.all([
    colChats.createIndex({ userId: 1, updatedAt: -1 }).catch(() => { }),
    colMessages.createIndex({ chatId: 1, createdAt: -1 }).catch(() => { }),
    colMessages.createIndex({ sender: 1 }).catch(() => { }),
  ]).catch(e => console.warn('Fallo creando índices Mongo:', e?.message || e));

  console.log('MongoDB conectado:', db.databaseName);
}

export { db, colChats, colMessages, colUsuarios, colSugerencias, colBalanceGeneral, colEstadoResultados };
