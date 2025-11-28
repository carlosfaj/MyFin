import { ObjectId } from 'mongodb';
import { colBalanceGeneral, colEstadoResultados } from '../utils/mongo.js';

export const FinancialRecordType = {
    INCOME_STATEMENT: 'income_statement',
    BALANCE_SHEET: 'balance_sheet',
};

export async function createFinancialRecord(record) {
    // record debe tener: type, userId, period, data (objeto anidado ya mapeado), rawData (opcional)
    const { type, userId, period, data, rawData } = record;

    const collection = type === FinancialRecordType.BALANCE_SHEET
        ? colBalanceGeneral
        : colEstadoResultados;

    if (!collection) throw new Error("Colección no inicializada");

    // Verificar si ya existe para ese usuario y periodo
    const existing = await collection.findOne({ userId, period });

    const doc = {
        userId,
        period,
        updatedAt: new Date(),
        rawData, // Guardar datos crudos originales
        ...data // Esparce BalanceGeneral: {...} o EstadoDeResultados: {...}
    };

    if (existing) {
        return collection.updateOne({ _id: existing._id }, { $set: doc });
    } else {
        doc.createdAt = new Date();
        return collection.insertOne(doc);
    }
}

export async function getFinancialRecords(userId) {
    if (!colBalanceGeneral || !colEstadoResultados) return [];

    const [balances, incomes] = await Promise.all([
        colBalanceGeneral.find({ userId }).toArray(),
        colEstadoResultados.find({ userId }).toArray()
    ]);

    // Normalizar salida para el frontend
    const results = [];

    balances.forEach(b => {
        results.push({
            _id: b._id,
            type: FinancialRecordType.BALANCE_SHEET,
            period: b.period,
            data: b.BalanceGeneral, // Extraer el objeto interno
            rawData: b.rawData, // Incluir datos crudos
            fullDoc: b
        });
    });

    incomes.forEach(i => {
        results.push({
            _id: i._id,
            type: FinancialRecordType.INCOME_STATEMENT,
            period: i.period,
            data: i.EstadoDeResultados, // Extraer el objeto interno
            rawData: i.rawData, // Incluir datos crudos
            fullDoc: i
        });
    });

    return results.sort((a, b) => b.period - a.period);
}
