import { flattenSchema } from './schemaMapper.js';

// Función auxiliar para buscar valores difusos
function findValue(data, keywords) {
    if (!data) return 0;

    // data ya debe ser un objeto plano { "Ventas": 1000, ... }
    const entries = Object.entries(data).map(([k, v]) => ({ concepto: k, valor: v }));

    const match = entries.find(e => {
        const concept = String(e.concepto).toLowerCase();
        return keywords.some(k => concept.includes(k.toLowerCase()));
    });

    return match ? Number(match.valor) || 0 : 0;
}

export function calculateRatios(currentData, previousData) {
    // Aplanar datos anidados
    const er = flattenSchema(currentData?.income_statement || {});
    const bg = flattenSchema(currentData?.balance_sheet || {});

    const erPrev = previousData ? flattenSchema(previousData.income_statement || {}) : {};
    const bgPrev = previousData ? flattenSchema(previousData.balance_sheet || {}) : {};

    // Extraer valores clave (Helpers)
    const getVal = (source, keys) => findValue(source, keys);

    // --- Balance General (Actual) ---
    const efectivo = getVal(bg, ['efectivo', 'caja', 'cash']);
    const inversiones = getVal(bg, ['inversiones', 'inversionestemporales']);
    const inventario = getVal(bg, ['inventario', 'inventory', 'existencias', 'almacen']);
    const cxc = getVal(bg, ['cuentas por cobrar', 'clientes', 'receivables', 'documentosporcobrar']);

    // Activo Corriente (Circulante)
    let activoCorriente = getVal(bg, ['activo corriente', 'activos corrientes', 'activocirculante']);
    if (!activoCorriente) {
        activoCorriente = efectivo + inversiones + inventario + cxc + getVal(bg, ['ivaacreditable']) + getVal(bg, ['anticipoaproveedores']);
    }

    // Activo Fijo
    let activoFijo = getVal(bg, ['activo fijo', 'fixed assets', 'propiedad planta', 'activofijo']);
    if (!activoFijo) {
        activoFijo = getVal(bg, ['terrenos']) + getVal(bg, ['edificios']) + getVal(bg, ['maquinaria']) + getVal(bg, ['mobiliario']) + getVal(bg, ['vehiculos']);
    }

    // Activo Total
    let activoTotal = getVal(bg, ['total activo', 'total assets', 'activo total']);
    if (!activoTotal) activoTotal = activoCorriente + activoFijo + getVal(bg, ['activodiferido']) + getVal(bg, ['otrosactivos']);

    // Pasivo Corriente (Corto Plazo)
    let pasivoCorriente = getVal(bg, ['pasivo corriente', 'pasivos corrientes', 'pasivoscortoplazo']);
    if (!pasivoCorriente) {
        pasivoCorriente = getVal(bg, ['proveedores']) + getVal(bg, ['documentosporpagar']) + getVal(bg, ['acreedoresdiversos']) + getVal(bg, ['impuestosobrelarentaporpagar']) + getVal(bg, ['dividendosporpagar']);
    }

    // Pasivo Total
    let pasivoTotal = getVal(bg, ['total pasivo', 'total liabilities', 'pasivo total']);
    if (!pasivoTotal) pasivoTotal = pasivoCorriente + getVal(bg, ['pasivofijo']) + getVal(bg, ['pasivodiferido']);

    // Patrimonio
    let patrimonio = getVal(bg, ['patrimonio', 'capital', 'equity', 'capitalcontribuido']) + getVal(bg, ['capitalganado']);
    if (!patrimonio) patrimonio = activoTotal - pasivoTotal;

    // --- Estado de Resultados (Actual) ---
    const ventas = getVal(er, ['ventas', 'ingresos', 'sales', 'revenue']);
    const ventasCredito = getVal(er, ['ventasalcredito']) || ventas; // Si no hay dato, asumimos total
    const costoVentas = getVal(er, ['costo de ventas', 'cost of sales', 'costos', 'costodeventa']);
    const utilidadBruta = getVal(er, ['utilidad bruta', 'gross profit', 'utilidadbruta']) || (ventas - Math.abs(costoVentas));

    const gastosVenta = getVal(er, ['gastosdeventa']);
    const gastosAdmin = getVal(er, ['gastosdeadministracion']);
    const gastosOp = getVal(er, ['gastos operativos', 'gastos de operación', 'gastosoperativos']) || (gastosVenta + gastosAdmin);

    const utilidadOp = getVal(er, ['utilidad operativa', 'operating income', 'utilidadoperativa']) || (utilidadBruta - Math.abs(gastosOp));
    const intereses = getVal(er, ['gastos financieros', 'intereses', 'gastosfinancieros', 'interesespagados']);
    const utilidadNeta = getVal(er, ['utilidad neta', 'net income', 'resultado del ejercicio', 'utilidadneta']);

    // --- Valores Previos (para promedios y horizontal) ---
    const inventarioPrev = getVal(bgPrev, ['inventario', 'inventory', 'existencias', 'almacen']);
    const cxcPrev = getVal(bgPrev, ['cuentas por cobrar', 'clientes', 'receivables']);
    const activoFijoPrev = getVal(bgPrev, ['activo fijo', 'fixed assets']);
    const activoTotalPrev = getVal(bgPrev, ['total activo', 'total assets']);

    // Promedios
    const inventarioPromedio = inventarioPrev ? (inventario + inventarioPrev) / 2 : inventario;
    const cxcPromedio = cxcPrev ? (cxc + cxcPrev) / 2 : cxc;
    const activoFijoPromedio = activoFijoPrev ? (activoFijo + activoFijoPrev) / 2 : activoFijo;
    const activoTotalPromedio = activoTotalPrev ? (activoTotal + activoTotalPrev) / 2 : activoTotal;

    // --- CÁLCULOS SOLICITADOS ---

    // 1. Análisis Vertical (Solo devolvemos estructura para UI, aquí calculamos ratios clave)
    // Se hace en frontend o se devuelve raw

    // 2. Análisis Horizontal (Variaciones)
    // Se hace en frontend comparando raw actual vs prev

    // 3. Capital Neto Operativo
    // Formula usuario: AC% - PC% (AC != Caja, efectivo, inversiones; PC != Impuesto, dividendos)
    // Interpretación: AC Operativo - PC Operativo
    const acOperativo = activoCorriente - efectivo - inversiones;
    const impuestosPorPagar = getVal(bg, ['impuestosobrelarentaporpagar', 'impuestos']);
    const dividendosPorPagar = getVal(bg, ['dividendosporpagar', 'dividendos']);
    const pcOperativo = pasivoCorriente - impuestosPorPagar - dividendosPorPagar;
    const capitalNetoOperativo = acOperativo - pcOperativo;

    // 4. Estado de Origen y Aplicación
    // Requiere comparar con previo
    const origenAplicacion = [];
    if (previousData) {
        // Helper para determinar O/A
        const calcOA = (key, currentVal, prevVal, type) => {
            const diff = currentVal - prevVal;
            if (diff === 0) return null;

            let isOrigen = false;
            // Activo: Aumenta -> Aplicación, Disminuye -> Origen
            if (type === 'activo') isOrigen = diff < 0;
            // Pasivo/Capital: Aumenta -> Origen, Disminuye -> Aplicación
            if (type === 'pasivo' || type === 'capital') isOrigen = diff > 0;

            return {
                cuenta: key,
                variacion: Math.abs(diff),
                tipo: isOrigen ? 'Origen' : 'Aplicación'
            };
        };

        // Recorrer cuentas principales (simplificado)
        // Activos
        Object.keys(bg).forEach(k => {
            // Ignorar totales calculados si están en el raw, o filtrar
            if (bgPrev[k] !== undefined) {
                // Determinar si es activo, pasivo o capital es difícil solo con el nombre plano
                // Usaremos la estructura conocida del usuario si es posible, o heurística
                // Por ahora, asumimos que si está en bg y no es pasivo/capital...
                // Mejor: Usar los grupos del esquema si pudiéramos. 
                // Como flattenSchema pierde estructura, esto es limitado.
                // Para MVP: Solo calculamos O/A de los grandes grupos calculados arriba
            }
        });

        // Manual O/A de grupos grandes
        const items = [
            { k: 'Activo Corriente', cur: activoCorriente, prev: getVal(bgPrev, ['activo corriente']) || 0, t: 'activo' },
            { k: 'Activo Fijo', cur: activoFijo, prev: activoFijoPrev || 0, t: 'activo' },
            { k: 'Pasivo Corriente', cur: pasivoCorriente, prev: getVal(bgPrev, ['pasivo corriente']) || 0, t: 'pasivo' },
            { k: 'Pasivo Largo Plazo', cur: pasivoTotal - pasivoCorriente, prev: (getVal(bgPrev, ['total pasivo']) || 0) - (getVal(bgPrev, ['pasivo corriente']) || 0), t: 'pasivo' },
            { k: 'Capital', cur: patrimonio, prev: getVal(bgPrev, ['patrimonio']) || 0, t: 'capital' }
        ];

        items.forEach(i => {
            const res = calcOA(i.k, i.cur, i.prev, i.t);
            if (res) origenAplicacion.push(res);
        });

        // Utilidad Neta y Depreciación siempre Origen
        if (utilidadNeta > 0) origenAplicacion.push({ cuenta: 'Utilidad Neta', variacion: utilidadNeta, tipo: 'Origen' });
        const depreciacion = getVal(er, ['depreciacion', 'depreciaciondeequiposdeventa', 'depreciaciondeedificiosymobiliarios']); // Sumar todas
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
    // ROE no pedido explícitamente en la lista nueva pero útil
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
            origenAplicacion
        },
        raw: {
            ventas, utilidadNeta, activoTotal, pasivoTotal, patrimonio, activoCorriente, pasivoCorriente
        }
    };
}
