import { flattenSchema } from './schemaMapper.js';

// --- DICCIONARIO DE EQUIVALENCIAS ---
const ACCOUNT_DICTIONARY = {
    efectivo: ['efectivo', 'caja', 'cash', 'disponible', 'bancos', 'tesoreria', 'efectivo y equivalentes'],
    inversiones: ['inversiones', 'inversionestemporales', 'valores negociables', 'inversiones a corto plazo'],
    inventario: ['inventario', 'inventory', 'existencias', 'almacen', 'mercancia', 'mercaderia', 'inventarios'],
    cxc: ['cuentas por cobrar', 'clientes', 'receivables', 'documentos por cobrar', 'deudores comerciales', 'deudores diversos'],
    activoCorriente: ['activo corriente', 'activos corrientes', 'activo circulante', 'activos circulantes', 'current assets', 'total activo circulante', 'total activo corriente'],
    activoFijo: ['activo fijo', 'fixed assets', 'propiedad planta', 'activo no corriente', 'activos no corrientes', 'inmovilizado material', 'total activo fijo'],
    activoTotal: ['total activo', 'total assets', 'activo total', 'suma del activo', 'activos totales'],
    pasivoCorriente: ['pasivo corriente', 'pasivos corrientes', 'pasivo circulante', 'pasivos circulantes', 'pasivo a corto plazo', 'current liabilities', 'deudas a corto plazo', 'total pasivos circulantes', 'total pasivo circulante', 'total pasivos corto plazo'],
    pasivoFijo: ['pasivo fijo', 'pasivos fijos', 'pasivo a largo plazo', 'long term liabilities', 'deuda a largo plazo', 'total pasivos fijos', 'total pasivo fijo'],
    pasivoTotal: ['total pasivo', 'total liabilities', 'pasivo total', 'suma del pasivo', 'pasivos totales', 'total pasivos'],
    patrimonio: ['patrimonio', 'capital', 'equity', 'capital contable', 'total capital', 'patrimonio neto', 'total patrimonio'],
    ventas: ['ventas', 'ingresos', 'sales', 'revenue', 'ventas netas', 'ingresos totales', 'ingresos por ventas', 'ventas totales'],
    ventasCredito: ['ventas a credito', 'ventas credito', 'credit sales'],
    costoVentas: ['costo de ventas', 'cost of sales', 'costos', 'costo de lo vendido', 'costo de bienes vendidos'],
    utilidadBruta: ['utilidad bruta', 'gross profit', 'ganancia bruta', 'margen bruto'],
    gastosVenta: ['gastos de venta', 'gastos de comercializacion'],
    gastosAdmin: ['gastos de administracion', 'gastos administrativos', 'gastos generales'],
    gastosOp: ['gastos operativos', 'gastos de operacion', 'operating expenses'],
    utilidadOp: ['utilidad operativa', 'operating income', 'utilidad de operacion', 'resultado operativo', 'ebit'],
    intereses: ['gastos financieros', 'intereses', 'intereses pagados', 'interest expense'],
    utilidadNeta: ['utilidad neta', 'net income', 'resultado del ejercicio', 'utilidad del ejercicio', 'ganancia neta'],
    depreciacion: ['depreciacion', 'amortizacion', 'depreciation']
};

// Función auxiliar para normalizar strings
function normalize(str) {
    return String(str).toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "");
}

// Algoritmo de Distancia de Levenshtein
function levenshteinDistance(a, b) {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix = [];

    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    Math.min(
                        matrix[i][j - 1] + 1, // insertion
                        matrix[i - 1][j] + 1 // deletion
                    )
                );
            }
        }
    }

    return matrix[b.length][a.length];
}

// Función mejorada para buscar valores (Diccionario + Fuzzy)
function findValue(data, keyType) {
    if (!data) return 0;

    // Obtener lista de sinónimos del diccionario
    const keywords = ACCOUNT_DICTIONARY[keyType] || [keyType];

    const entries = Object.entries(data).map(([k, v]) => ({
        concepto: k,
        norm: normalize(k),
        valor: v
    }));

    // 1. Búsqueda Exacta / Normalizada (Prioridad Alta)
    for (const keyword of keywords) {
        const keyNorm = normalize(keyword);
        const match = entries.find(e => e.norm.includes(keyNorm)); // Includes permite coincidencias parciales seguras
        if (match) return Number(match.valor) || 0;
    }

    // 2. Búsqueda Difusa (Levenshtein) (Prioridad Baja - Solo si no hay match exacto)
    // Solo buscamos si la palabra tiene cierta longitud para evitar falsos positivos cortos
    let bestMatch = null;
    let minDistance = Infinity;

    for (const keyword of keywords) {
        const keyNorm = normalize(keyword);
        if (keyNorm.length < 4) continue; // Ignorar palabras muy cortas para fuzzy

        for (const entry of entries) {
            const dist = levenshteinDistance(keyNorm, entry.norm);
            // Umbral: Permitimos 1 error por cada 4 caracteres aprox
            const threshold = Math.floor(keyNorm.length / 4) + 1;

            if (dist <= threshold && dist < minDistance) {
                minDistance = dist;
                bestMatch = entry;
            }
        }
    }

    if (bestMatch) {
        // console.log(`Fuzzy Match: ${keyType} -> ${bestMatch.concepto} (Dist: ${minDistance})`);
        return Number(bestMatch.valor) || 0;
    }

    return 0;
}

export function calculateRatios(currentData, previousData) {
    // Aplanar datos anidados
    const er = flattenSchema(currentData?.income_statement || {});
    const bg = flattenSchema(currentData?.balance_sheet || {});

    const erPrev = previousData ? flattenSchema(previousData.income_statement || {}) : {};
    const bgPrev = previousData ? flattenSchema(previousData.balance_sheet || {}) : {};

    // Helper simplificado que usa el diccionario interno
    const getVal = (source, keyType) => findValue(source, keyType);

    // --- Balance General (Actual) ---
    const efectivo = getVal(bg, 'efectivo');
    const inversiones = getVal(bg, 'inversiones');
    const inventario = getVal(bg, 'inventario');
    const cxc = getVal(bg, 'cxc');

    // Activo Corriente (Circulante) - STRICT MODE (Sin recálculo)
    const activoCorriente = getVal(bg, 'activoCorriente');

    // Activo Fijo
    const activoFijo = getVal(bg, 'activoFijo');

    // Activo Total
    const activoTotal = getVal(bg, 'activoTotal');

    // Pasivo Corriente (Corto Plazo)
    const pasivoCorriente = getVal(bg, 'pasivoCorriente');

    // Pasivo Total
    const pasivoTotal = getVal(bg, 'pasivoTotal');

    // Patrimonio
    const patrimonio = getVal(bg, 'patrimonio');

    // --- Estado de Resultados (Actual) ---
    const ventas = getVal(er, 'ventas');
    const ventasCredito = getVal(er, 'ventasCredito') || ventas;
    const costoVentas = getVal(er, 'costoVentas');
    const utilidadBruta = getVal(er, 'utilidadBruta') || (ventas - Math.abs(costoVentas));

    const gastosVenta = getVal(er, 'gastosVenta');
    const gastosAdmin = getVal(er, 'gastosAdmin');
    const gastosOp = getVal(er, 'gastosOp') || (gastosVenta + gastosAdmin);

    const utilidadOp = getVal(er, 'utilidadOp') || (utilidadBruta - Math.abs(gastosOp));
    const intereses = getVal(er, 'intereses');

    // Lógica especial para Utilidad Neta (Excluir "Antes de Impuestos")
    const findNetIncome = (data) => {
        if (!data) return 0;
        const entries = Object.entries(data).map(([k, v]) => ({ concepto: k, norm: normalize(k), valor: v }));

        // 1. Buscar explícitamente "Utilidad Neta" o "Resultado del Ejercicio" SIN "Antes"
        const keywords = ACCOUNT_DICTIONARY['utilidadNeta'];

        const match = entries.find(e => {
            const isNet = keywords.some(k => e.norm.includes(normalize(k)));
            const isBefore = (e.norm.includes('antes') || e.norm.includes('before'));
            return isNet && !isBefore;
        });

        if (match) return Number(match.valor);

        // 2. Si no, buscar "Utilidad Despues de Impuestos"
        const matchAfter = entries.find(e => {
            return e.norm.includes('despues') || e.norm.includes('after');
        });

        if (matchAfter) return Number(matchAfter.valor);

        return 0;
    };

    const utilidadNeta = findNetIncome(er);

    // --- Valores Previos (para promedios y horizontal) ---
    const inventarioPrev = getVal(bgPrev, 'inventario');
    const cxcPrev = getVal(bgPrev, 'cxc');
    const activoFijoPrev = getVal(bgPrev, 'activoFijo');
    const activoTotalPrev = getVal(bgPrev, 'activoTotal');

    // Promedios
    const inventarioPromedio = inventarioPrev ? (inventario + inventarioPrev) / 2 : inventario;
    const cxcPromedio = cxcPrev ? (cxc + cxcPrev) / 2 : cxc;
    const activoFijoPromedio = activoFijoPrev ? (activoFijo + activoFijoPrev) / 2 : activoFijo;
    const activoTotalPromedio = activoTotalPrev ? (activoTotal + activoTotalPrev) / 2 : activoTotal;

    // --- CÁLCULOS SOLICITADOS ---

    // 1. Análisis Horizontal (Variaciones)
    const horizontalAnalysis = {};
    if (previousData) {
        const calculateVariation = (current, previous) => {
            const diff = current - previous;
            const rel = previous !== 0 ? (diff / Math.abs(previous)) * 100 : 0;
            return { abs: diff, rel: rel };
        };

        const traverseAndCompare = (currObj, prevObj, targetObj) => {
            for (const key in currObj) {
                if (typeof currObj[key] === 'object' && currObj[key] !== null) {
                    targetObj[key] = {};
                    traverseAndCompare(currObj[key], prevObj?.[key] || {}, targetObj[key]);
                } else if (typeof currObj[key] === 'number') {
                    const prevVal = typeof prevObj?.[key] === 'number' ? prevObj[key] : 0;
                    targetObj[key] = {
                        value: currObj[key],
                        ...calculateVariation(currObj[key], prevVal)
                    };
                }
            }
        };

        horizontalAnalysis.balance_sheet = {};
        traverseAndCompare(currentData.balance_sheet, previousData.balance_sheet, horizontalAnalysis.balance_sheet);

        horizontalAnalysis.income_statement = {};
        traverseAndCompare(currentData.income_statement, previousData.income_statement, horizontalAnalysis.income_statement);
    }

    // 2. Capital Neto Operativo (AC% - PC%)
    const acPercent = activoTotal ? (activoCorriente / activoTotal) * 100 : 0;
    const pcPercent = (pasivoTotal + patrimonio) ? (pasivoCorriente / (pasivoTotal + patrimonio)) * 100 : 0;
    const capitalNetoOperativo = acPercent - pcPercent;

    // 3. Estado de Origen y Aplicación
    const origenAplicacion = [];
    if (previousData) {
        const calcOA = (key, currentVal, prevVal, type) => {
            const diff = currentVal - prevVal;
            if (diff === 0) return null;

            let isOrigen = false;
            if (type === 'activo') isOrigen = diff < 0;
            if (type === 'pasivo' || type === 'capital') isOrigen = diff > 0;

            return {
                cuenta: key,
                variacion: Math.abs(diff),
                tipo: isOrigen ? 'Origen' : 'Aplicación'
            };
        };

        const items = [
            { k: 'Activo Corriente', cur: activoCorriente, prev: getVal(bgPrev, 'activoCorriente') || 0, t: 'activo' },
            { k: 'Activo Fijo', cur: activoFijo, prev: activoFijoPrev || 0, t: 'activo' },
            { k: 'Pasivo Corriente', cur: pasivoCorriente, prev: getVal(bgPrev, 'pasivoCorriente') || 0, t: 'pasivo' },
            { k: 'Pasivo Largo Plazo', cur: pasivoTotal - pasivoCorriente, prev: (getVal(bgPrev, 'pasivoTotal') || 0) - (getVal(bgPrev, 'pasivoCorriente') || 0), t: 'pasivo' },
            { k: 'Capital', cur: patrimonio, prev: getVal(bgPrev, 'patrimonio') || 0, t: 'capital' }
        ];

        items.forEach(i => {
            const res = calcOA(i.k, i.cur, i.prev, i.t);
            if (res) origenAplicacion.push(res);
        });

        if (utilidadNeta > 0) origenAplicacion.push({ cuenta: 'Utilidad Neta', variacion: utilidadNeta, tipo: 'Origen' });
        const depreciacion = getVal(er, 'depreciacion');
        if (depreciacion > 0) origenAplicacion.push({ cuenta: 'Depreciación', variacion: depreciacion, tipo: 'Origen' });
    }

    // --- RATIOS ---

    // 1. Liquidez
    const capitalNetoTrabajo = activoCorriente - pasivoCorriente;
    const razonCirculante = pasivoCorriente ? (activoCorriente / pasivoCorriente) : 0;
    const razonRapida = pasivoCorriente ? ((activoCorriente - inventario) / pasivoCorriente) : 0;

    // 2. Actividad
    const rotacionInventario = inventarioPromedio ? (Math.abs(costoVentas) / inventarioPromedio) : 0;
    const rotacionCxC = cxcPromedio ? (ventasCredito / cxcPromedio) : 0;
    const periodoPromedioCobro = rotacionCxC ? (360 / rotacionCxC) : 0;
    const rotacionActivosFijos = activoFijoPromedio ? (ventas / activoFijoPromedio) : 0;
    const rotacionActivosTotales = activoTotalPromedio ? (ventas / activoTotalPromedio) : 0;

    // 3. Endeudamiento
    const razonEndeudamiento = activoTotal ? (pasivoTotal / activoTotal) : 0;
    const razonPasivoCapital = patrimonio ? (pasivoTotal / patrimonio) : 0;
    const rotacionInteresesUtilidades = intereses ? (utilidadOp / intereses) : 0;

    // 4. Rentabilidad
    const mub = ventas ? (utilidadBruta / ventas) * 100 : 0;
    const muo = ventas ? (utilidadOp / ventas) * 100 : 0;
    const mun = ventas ? (utilidadNeta / ventas) * 100 : 0;
    const roa = activoTotal ? (utilidadNeta / activoTotal) * 100 : 0;
    const roe = patrimonio ? (utilidadNeta / patrimonio) * 100 : 0;

    return {
        liquidez: {
            capitalNetoTrabajo: { valor: capitalNetoTrabajo, optimo: '> 0' },
            razonCirculante: { valor: razonCirculante, optimo: '1.5 - 2.0' },
            razonRapida: { valor: razonRapida, optimo: '1.0' }
        },
        actividad: {
            rotacionInventario: { valor: rotacionInventario, optimo: '5 - 10' },
            rotacionCxC: { valor: rotacionCxC, optimo: '6 - 12' },
            periodoPromedioCobro: { valor: periodoPromedioCobro, optimo: '30 - 45 días' },
            rotacionActivosFijos: { valor: rotacionActivosFijos, optimo: '5 - 8' },
            rotacionActivosTotales: { valor: rotacionActivosTotales, optimo: '1.0 - 2.5' }
        },
        endeudamiento: {
            razonEndeudamiento: { valor: razonEndeudamiento, optimo: '0.3 - 0.5' },
            razonPasivoCapital: { valor: razonPasivoCapital, optimo: '0.5 - 1.0' },
            rotacionInteresesUtilidades: { valor: rotacionInteresesUtilidades, optimo: '3 - 5' }
        },
        rentabilidad: {
            margenUtilidadBruta: { valor: mub, optimo: '20% - 40%' },
            margenUtilidadOperativa: { valor: muo, optimo: '10% - 20%' },
            margenUtilidadNeta: { valor: mun, optimo: '5% - 10%' },
            roa: { valor: roa, optimo: '5% - 10%' },
            roe: { valor: roe, optimo: '10% - 15%' }
        },
        otros: {
            capitalNetoOperativo,
            acPercent,
            pcPercent,
            origenAplicacion
        },
        horizontalAnalysis,
        raw: {
            ventas, utilidadNeta, activoTotal, pasivoTotal, patrimonio, activoCorriente, pasivoCorriente
        }
    };
}
