import callGemini from './genAI.js';

const BALANCE_SCHEMA_STR = `
{
  "BalanceGeneral": {
    "ActivoCorriente": {
      "Efectivo": 0, "Banco": 0, "InversionesTemporales": 0, "Clientes": 0, "DocumentosPorCobrar": 0, "Inventarios": 0, "IVAAcreditable": 0, "Publicidad": 0, "PrimasDeSegurosYFianzas": 0, "RentasPagadasPorAnticipado": 0, "InteresesPagadosPorAnticipados": 0, "PapeleriaYUtiles": 0, "AnticipoAProveedores": 0
    },
    "ActivoFijo": {
      "Terrenos": 0, "Edificios": 0, "Maquinaria": 0, "MobiliarioYEquipoDeOficina": 0, "EquipoDeTransporte": 0, "Vehiculos": 0
    },
    "ActivoDiferido": {
      "GastosPreoperativos": 0, "DerechosDeAutor": 0, "Patentes": 0, "MarcasRegistradas": 0, "GastosDeOrganizacion": 0, "GastosDeConstitucion": 0, "GastosDeInstalacion": 0, "PublicidadALargoPlazo": 0, "PapeleriaYUtilesALargoPlazo": 0, "RentasPagadasPorAnticipadoALargoPlazo": 0, "InteresesPagadosPorAnticipadoALargoPlazo": 0
    },
    "OtrosActivos": {
      "InversionesEnProceso": 0, "FondoDeAmortizacionDeObligaciones": 0
    },
    "PasivosCortoPlazo": {
      "Proveedores": 0, "DocumentosPorPagar": 0, "AcreedoresDiversos": 0, "AnticipoDeClientes": 0, "DividendosPorPagar": 0, "IVAPorPagar": 0, "ImpuestoSobreLaRentaPorPagar": 0, "InteresesPorPagar": 0, "SueldosPorPagar": 0, "IngresosCobradosPorAnticipado": 0
    },
    "PasivoFijo": {
      "AcreedoresHipotecarios": 0, "AcreedoresBancarios": 0, "DocumentosPorPagarALargoPlazo": 0, "BonosPorPagar": 0
    },
    "PasivoDiferido": {
      "RentasCobradasPorAnticipado": 0, "InteresesCobradosPorAnticipado": 0
    },
    "CapitalContribuido": {
      "CapitalSocial": 0, "Donaciones": 0, "PrimaEnVentaDeAcciones": 0
    },
    "CapitalGanado": {
      "UtilidadesRetenidas": 0, "UtilidadNeta": 0
    }
  }
}
`;

const INCOME_SCHEMA_STR = `
{
  "EstadoDeResultados": {
    "VentasYVariantes": {
      "Ventas": 0, "VentasAlCredito": 0, "Devoluciones": 0, "Rebajas": 0, "Descuentos": 0, "CostoDeVenta": 0, "UtilidadBruta": 0
    },
    "GastosOperativos": {
      "GastosDeVenta": {
        "RentaDelAlmacen": 0, "PropagandaYPublicidad": 0, "SueldoDeVendedores": 0, "ComisionesDeVendedores": 0, "ConsumoDeLuzVenta": 0, "ImpuestosSobreIngresosMercantiles": 0, "DepreciacionDeEquiposDeVenta": 0
      },
      "GastosDeAdministracion": {
        "RentaDeOficina": 0, "SueldoDeOficina": 0, "Papeleria": 0, "ConsumoDeLuzOficina": 0, "ServiciosDeComunicacion": 0, "DepreciacionDeEdificiosYMobiliarios": 0
      }
    },
    "GastosFinancieros": {
      "InteresesPagadosPorSobreDocumentos": 0, "ComisionesBancariasPagadas": 0, "InteresesPagados": 0, "UtilidadOperativa": 0
    },
    "OtrosRubros": {
      "OtrosGastos": {
        "PerdidaEnVentasDeActivo": 0, "ComisionesPagadas": 0, "RentasPagadas": 0
      },
      "OtrosProductos": {
        "ComisionesCobradas": 0, "RentasCobradas": 0, "UtilidadEnVentaDeAcciones": 0
      }
    },
    "Utilidades": {
      "UtilidadNetaAntesDeIR": 0, "IR": 0, "UtilidadNeta": 0, "DividendosRepartidos": 0, "UtilidadDelEjercicio": 0
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
2. Si un concepto no tiene una coincidencia exacta, usa tu criterio contable para clasificarlo.
3. IMPORTANTE: Si el documento importado NO contiene una cuenta que está en el formato predeterminado, IGNÓRALA. No la incluyas en el JSON final con valor 0 ni null. Simplemente omite esa clave.
4. Devuelve SOLAMENTE el JSON válido con la estructura llena. No incluyas explicaciones ni texto adicional.
5. Asegúrate de que los valores sean numéricos.
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

  const prompt = `
Actúa como un experto contable forense. Tienes una hoja de cálculo cruda (array de arrays) que contiene un ${type === 'balance_sheet' ? 'Balance General' : 'Estado de Resultados'}.

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
2. **Extracción**: Para cada año encontrado, recorre las filas, busca los conceptos del esquema (ej. "Efectivo", "Ventas") y extrae el valor numérico de la columna correspondiente a ese año.
3. **Mapeo**: Asigna los valores al esquema JSON.
4. **Salida**: Devuelve UNICAMENTE un ARRAY de objetos JSON válido.

FORMATO DE SALIDA ESPERADO:
[
  {
    "period": "2012",
    "data": {
      "BalanceGeneral": { "ActivoCorriente": { "Efectivo": 1500.00, ... } }
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