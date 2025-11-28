import callGemini from './genAI.js';

const BALANCE_SCHEMA_STR = `
{
  "BalanceGeneral": {
    "ActivoCorriente": {
      "//": "Incluye TODAS las cuentas de activo corriente encontradas (Efectivo, Bancos, Clientes, Inventarios, etc.)",
      "Efectivo": 0, "Banco": 0, "...": 0
    },
    "ActivoFijo": {
      "//": "Incluye TODAS las cuentas de activo fijo (Terrenos, Edificios, Maquinaria, etc.)",
      "Terrenos": 0, "...": 0
    },
    "ActivoDiferido": {
      "//": "Incluye TODAS las cuentas de activo diferido",
      "...": 0
    },
    "OtrosActivos": { "...": 0 },
    "PasivosCirculantes": {
      "//": "Incluye TODAS las cuentas de pasivos circulantes (Proveedores, Impuestos, etc.)",
      "Proveedores": 0, "...": 0
    },
    "PasivosFijos": {
      "//": "Incluye TODAS las cuentas de pasivos fijos (Deuda bancaria, Hipotecas, etc.)",
      "...": 0
    },
    "PasivosDiferidos": { "...": 0 },
    "CapitalContribuido": {
      "//": "Incluye TODAS las cuentas de capital contribuido (Capital Social, Acciones, etc.)",
      "CapitalSocial": 0, "...": 0
    },
    "CapitalGanado": {
      "//": "Incluye TODAS las cuentas de capital ganado (Utilidades Retenidas, Utilidad Neta, Reservas, etc.)",
      "UtilidadesRetenidas": 0, "...": 0
    }
  }
}
`;

const INCOME_SCHEMA_STR = `
{
  "EstadoDeResultados": {
    "VentasYVariantes": {
      "//": "Incluye TODAS las cuentas de ingresos (Ventas, Devoluciones, etc.)",
      "Ventas": 0, "...": 0
    },
    "GastosOperativos": {
      "GastosDeVenta": {
        "//": "Incluye TODOS los gastos de venta",
        "...": 0
      },
      "GastosDeAdministracion": {
        "//": "Incluye TODOS los gastos de administración",
        "...": 0
      }
    },
    "GastosFinancieros": {
      "//": "Incluye TODOS los gastos e ingresos financieros",
      "...": 0
    },
    "OtrosRubros": {
      "OtrosGastos": { "...": 0 },
      "OtrosProductos": { "...": 0 }
    },
    "Utilidades": {
      "//": "Incluye impuestos y resultados finales",
      "UtilidadNeta": 0, "...": 0
    }
  }
}
`;

export async function parseFinancialDataWithAI(rawData, type) {
  const schema = type === 'balance_sheet' ? BALANCE_SCHEMA_STR : INCOME_SCHEMA_STR;

  const prompt = `
Actúa como un experto contable y analista de datos.
Tu tarea es mapear los siguientes datos financieros crudos (extraídos de un Excel) a una estructura JSON específica.

DATOS CRUDOS:
${JSON.stringify(rawData, null, 2)}

ESTRUCTURA OBJETIVO (JSON):
${schema}

INSTRUCCIONES:
1. Analiza cada concepto de los datos crudos y asígnalo al campo más apropiado de la estructura objetivo.
2. **EXTRACCIÓN DINÁMICA**: NO te limites a los ejemplos del esquema. Extrae **TODAS** las cuentas que encuentres en los datos crudos y colócalas en la categoría que mejor corresponda.
3. **NOMBRE DE LAS CUENTAS**: Usa el nombre exacto que aparece en el Excel (o una versión normalizada clara) como clave en el JSON.
4. **INCLUIR TOTALES**: SIEMPRE extrae la fila de 'Total' de cada sección (ej. "Total Activo Corriente", "Total Pasivo", "Suma del Activo") y inclúyela como una cuenta más dentro de esa sección. ESTO ES CRÍTICO para tener el valor exacto.
5. Devuelve SOLAMENTE el JSON válido con la estructura llena. No incluyas explicaciones ni texto adicional.
6. Asegúrate de que los valores sean numéricos.
`;

  try {
    const responseText = await callGemini(prompt);

    // Extracción robusta de JSON: Buscar el primer '{' y el último '}'
    const firstBrace = responseText.indexOf('{');
    const lastBrace = responseText.lastIndexOf('}');

    if (firstBrace === -1 || lastBrace === -1) {
      // Fallback a limpieza simple si no encuentra llaves
      const jsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(jsonStr);
    }

    const jsonStr = responseText.substring(firstBrace, lastBrace + 1);
    return JSON.parse(jsonStr);

  } catch (error) {
    console.error("Error parsing financial data with AI:", error);
    throw new Error("Falló el procesamiento inteligente de datos.");
  }
}

export async function extractFinancialDataWithAI(rawRows, type) {
  const schema = type === 'balance_sheet' ? BALANCE_SCHEMA_STR : INCOME_SCHEMA_STR;

  // 1. Limpieza de datos: Eliminar filas/columnas vacías para reducir ruido
  const cleanRows = rawRows.filter(row => row && row.some(cell => cell !== null && cell !== '' && cell !== undefined));

  // Tomar solo las primeras 150 filas (aumentado de 100 para cubrir más contexto)
  const truncatedRows = cleanRows.slice(0, 150);

  if (truncatedRows.length === 0) {
    throw new Error(`La hoja ${type} no contiene datos válidos para procesar.`);
  }

  const isBalance = type === 'balance_sheet';

  const prompt = `
Actúa como un experto contable forense. Tienes una hoja de cálculo cruda (array de arrays) que contiene un ${isBalance ? 'Balance General' : 'Estado de Resultados'}.

OBJETIVO:
Identificar los años (periodos) y extraer los datos financieros correspondientes a cada año, mapeándolos al esquema JSON estándar.

DATOS CRUDOS (Filas):
${JSON.stringify(truncatedRows)}

ESQUEMA OBJETIVO (Para cada año):
${schema}

INSTRUCCIONES CRÍTICAS:
1. **Identificar Años**: Busca encabezados de años (ej. "2012", "2011", "Año 2023"). Pueden estar en la fila 0, 1, 2, o incluso mezclados con texto.
   - OJO: A veces los años están en columnas adyacentes (ej. Col C=2012, Col D=2011).
   - A veces hay una fila de títulos y DEBAJO los años.
2. **Extracción Estricta**: Para cada año, extrae las cuentas y sus valores.
3. **RESPETAR JERARQUÍA VISUAL**: Mapea las cuentas al esquema JSON basándote **ESTRICTAMENTE** en cómo aparecen agrupadas en el archivo original.
   - **CRÍTICO**: Si una cuenta aparece visualmente bajo la sección de "Pasivos Corrientes" (o similar) en el Excel, **DEBES** colocarla en \`PasivosCirculantes\` en el JSON, **INCLUSO SI** el nombre de la cuenta dice "Largo Plazo" o parece pertenecer a otra categoría.
   - **NO RECLASIFIQUES**: No muevas cuentas de categoría basándote en tu conocimiento contable. Tu trabajo es reflejar la estructura del archivo, no corregirla.
4. **INCLUIR TOTALES**: SIEMPRE extrae la fila de 'Total' de cada sección (ej. "Total Activo Corriente", "Total Pasivos Circulantes", "Total Pasivo") y inclúyela como una cuenta más dentro de esa sección. ESTO ES CRÍTICO.
5. **Mapeo**: Asigna los valores al esquema. Si hay cuentas que no encajan en las claves estándar, agrégalas con su nombre original.
6. **Salida**: Devuelve UNICAMENTE un ARRAY de objetos JSON válido.

FORMATO DE SALIDA ESPERADO:
[
  {
    "period": "2012",
    "data": {
      "BalanceGeneral": { "ActivoCorriente": { "Efectivo": 1500.00, "TotalActivoCorriente": 2000.00, ... } }
    }
  },
  {
    "period": "2011",
    "data": { ... }
  }
]

REGLAS:
- Si no encuentras un valor, NO inventes. Omite la clave.
- Si hay celdas combinadas o valores desplazados, usa tu criterio lógico para asociarlos.
- Devuelve SOLO JSON puro. Sin markdown, sin explicaciones.
`;

  try {
    console.log(`🤖 Consultando a Gemini para extracción completa de ${type} (${truncatedRows.length} filas)...`);
    const responseText = await callGemini(prompt);

    // Extracción robusta de JSON: Buscar el primer '[' y el último ']'
    const firstBracket = responseText.indexOf('[');
    const lastBracket = responseText.lastIndexOf(']');

    if (firstBracket === -1 || lastBracket === -1) {
      console.error("Respuesta cruda IA (Sin JSON):", responseText);
      const snippet = responseText.length > 200 ? responseText.substring(0, 200) + "..." : responseText;
      throw new Error(`La IA no devolvió un array JSON válido. Respuesta: "${snippet}"`);
    }

    const jsonStr = responseText.substring(firstBracket, lastBracket + 1);

    try {
      const result = JSON.parse(jsonStr);
      if (!Array.isArray(result)) {
        throw new Error("El JSON parseado no es un array.");
      }
      return result;
    } catch (parseError) {
      console.error("Error parseando JSON de IA:", parseError);
      console.error("String intentado:", jsonStr);
      throw new Error("La IA devolvió un JSON malformado.");
    }
  } catch (error) {
    console.error("Error extracting financial data with AI:", error);
    throw error;
  }
}