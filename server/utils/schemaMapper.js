
// Estructura base del Balance General según el esquema del usuario
const BALANCE_TEMPLATE = {
    BalanceGeneral: {
        ActivoCorriente: {
            Efectivo: 0, Banco: 0, InversionesTemporales: 0, Clientes: 0, DocumentosPorCobrar: 0,
            Inventarios: 0, IVAAcreditable: 0, Publicidad: 0, PrimasDeSegurosYFianzas: 0,
            RentasPagadasPorAnticipado: 0, InteresesPagadosPorAnticipados: 0, PapeleriaYUtiles: 0,
            AnticipoAProveedores: 0
        },
        ActivoFijo: {
            Terrenos: 0, Edificios: 0, Maquinaria: 0, MobiliarioYEquipoDeOficina: 0,
            EquipoDeTransporte: 0, Vehiculos: 0
        },
        ActivoDiferido: {
            GastosPreoperativos: 0, DerechosDeAutor: 0, Patentes: 0, MarcasRegistradas: 0,
            GastosDeOrganizacion: 0, GastosDeConstitucion: 0, GastosDeInstalacion: 0,
            PublicidadALargoPlazo: 0, PapeleriaYUtilesALargoPlazo: 0,
            RentasPagadasPorAnticipadoALargoPlazo: 0, InteresesPagadosPorAnticipadoALargoPlazo: 0
        },
        OtrosActivos: {
            InversionesEnProceso: 0, FondoDeAmortizacionDeObligaciones: 0
        },
        PasivosCortoPlazo: {
            Proveedores: 0, DocumentosPorPagar: 0, AcreedoresDiversos: 0, AnticipoDeClientes: 0,
            DividendosPorPagar: 0, IVAPorPagar: 0, ImpuestoSobreLaRentaPorPagar: 0,
            InteresesPorPagar: 0, SueldosPorPagar: 0, IngresosCobradosPorAnticipado: 0
        },
        PasivoFijo: {
            AcreedoresHipotecarios: 0, AcreedoresBancarios: 0, DocumentosPorPagarALargoPlazo: 0,
            BonosPorPagar: 0
        },
        PasivoDiferido: {
            RentasCobradasPorAnticipado: 0, InteresesCobradosPorAnticipado: 0
        },
        CapitalContribuido: {
            CapitalSocial: 0, Donaciones: 0, PrimaEnVentaDeAcciones: 0
        },
        CapitalGanado: {
            UtilidadesRetenidas: 0, UtilidadNeta: 0
        }
    }
};

// Estructura base del Estado de Resultados
const INCOME_TEMPLATE = {
    EstadoDeResultados: {
        VentasYVariantes: {
            Ventas: 0, VentasAlCredito: 0, Devoluciones: 0, Rebajas: 0, Descuentos: 0,
            CostoDeVenta: 0, UtilidadBruta: 0
        },
        GastosOperativos: {
            GastosDeVenta: {
                RentaDelAlmacen: 0, PropagandaYPublicidad: 0, SueldoDeVendedores: 0,
                ComisionesDeVendedores: 0, ConsumoDeLuzVenta: 0, ImpuestosSobreIngresosMercantiles: 0,
                DepreciacionDeEquiposDeVenta: 0
            },
            GastosDeAdministracion: {
                RentaDeOficina: 0, SueldoDeOficina: 0, Papeleria: 0, ConsumoDeLuzOficina: 0,
                ServiciosDeComunicacion: 0, DepreciacionDeEdificiosYMobiliarios: 0
            }
        },
        GastosFinancieros: {
            InteresesPagadosPorSobreDocumentos: 0, ComisionesBancariasPagadas: 0,
            InteresesPagados: 0, UtilidadOperativa: 0
        },
        OtrosRubros: {
            OtrosGastos: {
                PerdidaEnVentasDeActivo: 0, ComisionesPagadas: 0, RentasPagadas: 0
            },
            OtrosProductos: {
                ComisionesCobradas: 0, RentasCobradas: 0, UtilidadEnVentaDeAcciones: 0
            }
        },
        Utilidades: {
            UtilidadNetaAntesDeIR: 0, IR: 0, UtilidadNeta: 0, DividendosRepartidos: 0,
            UtilidadDelEjercicio: 0
        }
    }
};

// Helper para limpiar strings y comparar
const normalize = (str) => String(str).toLowerCase().replace(/[^a-z0-9]/g, '');

// Mapa de sinónimos comunes para mapeo inteligente
const SYNONYMS = {
    'efectivo': ['caja', 'disponible', 'cash'],
    'banco': ['bancos', 'cuentas bancarias'],
    'clientes': ['cuentas por cobrar comerciales', 'deudores comerciales'],
    'inventarios': ['almacen', 'mercaderias', 'existencias'],
    'proveedores': ['cuentas por pagar', 'suppliers'],
    'ventas': ['ingresos por ventas', 'revenue', 'sales'],
    'costodeventa': ['costo de ventas', 'costos de venta', 'cost of sales'],
    'utilidadneta': ['resultado del ejercicio', 'net income', 'ganancia neta'],
    'ir': ['impuesto a la renta', 'isr', 'income tax'],
};

export function mapToSchema(type, flatData) {
    // Clonar template
    const template = type === 'balance_sheet'
        ? JSON.parse(JSON.stringify(BALANCE_TEMPLATE))
        : JSON.parse(JSON.stringify(INCOME_TEMPLATE));

    const rootKey = type === 'balance_sheet' ? 'BalanceGeneral' : 'EstadoDeResultados';
    const root = template[rootKey];

    // Función recursiva para llenar el objeto
    const fillObject = (obj) => {
        for (const key in obj) {
            if (typeof obj[key] === 'object' && obj[key] !== null) {
                fillObject(obj[key]);
            } else {
                // Intentar encontrar valor en flatData
                // 1. Coincidencia exacta de clave
                if (flatData[key] !== undefined) {
                    obj[key] = Number(flatData[key]) || 0;
                    continue;
                }

                // 2. Coincidencia normalizada
                const normKey = normalize(key);
                const match = Object.keys(flatData).find(k => {
                    const normInput = normalize(k);
                    if (normInput === normKey) return true;
                    // Revisar sinónimos
                    if (SYNONYMS[normKey] && SYNONYMS[normKey].some(s => normalize(s) === normInput)) return true;
                    return false;
                });

                if (match) {
                    obj[key] = Number(flatData[match]) || 0;
                }
            }
        }
    };

    fillObject(root);
    return template;
}

export function flattenSchema(nestedData) {
    const result = {};

    const recurse = (obj) => {
        for (const key in obj) {
            if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
                recurse(obj[key]);
            } else {
                result[key] = obj[key];
            }
        }
    };

    recurse(nestedData);
    return result;
}
