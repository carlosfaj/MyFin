import express from 'express';
import { calculateRatios } from '../utils/financialCalculations.js';
import { extractFinancialDataWithAI, parseFinancialDataWithAI } from '../services/aiParser.js';

const router = express.Router();

// Procesar registros financieros (Sin guardar en DB)
router.post('/api/financial-records', async (req, res) => {
    try {
        const { records, rawSheets } = req.body;

        const byPeriod = {};

        // MODO 1: Procesamiento de Hojas Crudas (Nueva Lógica AI Full)
        const processingErrors = [];
        if (rawSheets && Array.isArray(rawSheets)) {
            console.log(`📥 Recibidas ${rawSheets.length} hojas crudas para análisis AI...`);

            for (const sheet of rawSheets) {
                try {
                    // sheet = { type: 'balance_sheet', rows: [...] }
                    const extractedPeriods = await extractFinancialDataWithAI(sheet.rows, sheet.type);

                    // extractedPeriods = [{ period: "2012", data: {...} }, ...]
                    if (!extractedPeriods || extractedPeriods.length === 0) {
                        processingErrors.push(`Hoja ${sheet.type}: La IA no encontró periodos válidos.`);
                        continue;
                    }

                    for (const item of extractedPeriods) {
                        if (!byPeriod[item.period]) byPeriod[item.period] = {};
                        byPeriod[item.period][sheet.type] = item.data;

                        // Guardar raw para referencia
                        byPeriod[item.period][`${sheet.type}_raw`] = item.data;
                    }
                } catch (err) {
                    console.error(`Error procesando hoja ${sheet.type}:`, err);
                    processingErrors.push(`Hoja ${sheet.type}: ${err.message}`);
                }
            }
        }
        // MODO 2: Procesamiento de Registros Pre-procesados (Lógica Antigua)
        else if (records && Array.isArray(records)) {
            // Procesar cada registro
            for (const record of records) {
                if (!record.type || !record.period || !record.data) {
                    continue;
                }

                let mappedData;

                try {
                    // Intentar mapeo con IA
                    console.log(`Procesando con IA: ${record.type} - ${record.period}`);
                    const timeoutPromise = new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('AI timeout')), 30000)
                    );
                    const aiPromise = parseFinancialDataWithAI(record.data, record.type);
                    mappedData = await Promise.race([aiPromise, timeoutPromise]);
                } catch (aiError) {
                    console.warn('⚠️ AI parser falló, usando mapper estático:', aiError.message);
                    const { mapToSchema } = await import('../utils/schemaMapper.js');
                    mappedData = mapToSchema(record.type, record.data);
                }

                // Agrupar por periodo
                if (!byPeriod[record.period]) byPeriod[record.period] = {};
                byPeriod[record.period][record.type] = mappedData;

                // Incluir datos crudos para validación (si existen)
                if (record.data) {
                    byPeriod[record.period][`${record.type}_raw`] = record.data;
                }
            }
        } else {
            return res.status(400).json({ error: 'Se requiere un array de registros o hojas crudas' });
        }

        // Calcular ratios para el periodo más reciente
        const periods = Object.keys(byPeriod).sort().reverse();

        if (periods.length === 0) {
            const errorMsg = processingErrors.length > 0
                ? `Falló el análisis: ${processingErrors.join(' | ')}`
                : 'No se pudieron extraer periodos válidos de los datos.';
            return res.status(400).json({ error: errorMsg });
        }

        const currentPeriod = periods[0];
        const previousPeriod = periods[1];

        console.log(`Calculando análisis para periodo: ${currentPeriod} (Previo: ${previousPeriod || 'Ninguno'})`);

        const analysis = calculateRatios(
            byPeriod[currentPeriod],
            previousPeriod ? byPeriod[previousPeriod] : null
        );

        // Retornar todo el objeto de análisis para que el frontend lo guarde en sesión
        res.json({
            success: true,
            hasData: true,
            currentPeriod,
            analysis,
            raw: byPeriod
        });

    } catch (error) {
        console.error('Error procesando registros:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Endpoints deprecados (ya no se usa DB)
router.get('/api/financial-analysis', (req, res) => {
    res.json({ hasData: false, message: "Modo sesión activado" });
});

router.delete('/api/financial-records', (req, res) => {
    res.json({ success: true, message: "No hay datos persistentes que borrar" });
});

export default router;
