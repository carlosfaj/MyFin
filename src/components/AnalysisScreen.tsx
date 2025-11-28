import { useState, useEffect, Fragment, JSX } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { AlertCircle, FileText, Info } from "lucide-react";
import { Button } from "./ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";

interface AnalysisScreenProps {
  onNavigate: (screen: any) => void;
}

// Helper para buscar valores insensible a mayúsculas/minúsculas y acentos
const findValueByKey = (obj: any, keyToFind: string): number | null => {
  if (!obj || typeof obj !== 'object') return null;
  
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const target = normalize(keyToFind);

  for (const key in obj) {
    if (normalize(key) === target) {
      return typeof obj[key] === 'number' ? obj[key] : null;
    }
  }
  
  // Búsqueda profunda si no está en el primer nivel
  for (const key in obj) {
    if (typeof obj[key] === 'object') {
      const found = findValueByKey(obj[key], keyToFind);
      if (found !== null) return found;
    }
  }
  
  return null;
};

export function AnalysisScreen({ onNavigate }: AnalysisScreenProps) {
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalysis = () => {
    setLoading(true);
    setError(null);
    try {
      const storedData = localStorage.getItem('financialAnalysis');
      
      if (storedData) {
        const data = JSON.parse(storedData);
        setAnalysisData(data);
      } else {
        setError('No hay datos en la sesión. Por favor importa un archivo.');
      }
    } catch (err: any) {
      setError('Error al leer datos de la sesión.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Cargando análisis...</span>
      </div>
    );
  }

  if (error || !analysisData) {
    return (
      <div className="p-6 space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error || "No se encontraron datos de análisis."}</AlertDescription>
        </Alert>
        <Button onClick={() => onNavigate('import')}>
          Importar Datos
        </Button>
      </div>
    );
  }

  const { analysis, currentPeriod, raw } = analysisData;

  if (!analysis) {
    return (
      <div className="p-6 space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error de Datos</AlertTitle>
          <AlertDescription>Los datos guardados están incompletos. Por favor importa nuevamente.</AlertDescription>
        </Alert>
        <Button onClick={() => onNavigate('import')}>
          Volver a Importar
        </Button>
      </div>
    );
  }

  // Helper para formatear moneda
  const formatCurrency = (value: number) => {
    if (value === undefined || value === null) return 'N/A';
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(value);
  };

  // Helper para formatear porcentaje
  const formatPercent = (value: number) => {
    if (value === undefined || value === null) return 'N/A';
    return `${(value * 100).toFixed(2)}%`;
  };
  
  // Helper para formatear porcentaje simple (ya multiplicado por 100 o directo)
  const formatSimplePercent = (value: number) => {
     if (value === undefined || value === null || isNaN(value)) return '0.00%';
     return `${value.toFixed(2)}%`;
  };

  // Helper para formatear número
  const formatNumber = (value: number) => {
    if (value === undefined || value === null) return 'N/A';
    return value.toFixed(2);
  };

  // --- LÓGICA DE ANÁLISIS VERTICAL ---

  const rawPeriods = raw ? Object.keys(raw).sort().reverse() : [];

  // Helper para sumar recursivamente valores numéricos en una estructura
  const calculateRecursiveTotal = (data: any): number => {
    if (typeof data === 'number') return data;
    if (!data || typeof data !== 'object') return 0;
    
    let sum = 0;
    for (const key in data) {
      if (typeof data[key] === 'object') {
        sum += calculateRecursiveTotal(data[key]);
      } else if (typeof data[key] === 'number') {
        sum += data[key];
      }
    }
    return sum;
  };

  // Calcular totales base para cada periodo
  const periodTotals: Record<string, { totalAssets: number; netSales: number; totalLiabilities: number; totalEquity: number }> = {};

  rawPeriods.forEach(period => {
    const periodData = raw[period];
    
    // Buscar Total Activos
    let totalAssets = findValueByKey(periodData?.balance_sheet, 'Total Activos') || 
                      findValueByKey(periodData?.balance_sheet, 'Total Activo') ||
                      findValueByKey(periodData?.balance_sheet, 'Total Assets');
                      
    if (!totalAssets) {
        // Fallback: Sumar recursivamente si no hay total explícito
        // Intentamos sumar las ramas principales si existen para ser más precisos
        const ac = calculateRecursiveTotal(periodData?.balance_sheet?.['ActivoCorriente'] || periodData?.balance_sheet?.['Activo Corriente']);
        const anc = calculateRecursiveTotal(periodData?.balance_sheet?.['ActivoNoCorriente'] || periodData?.balance_sheet?.['Activo No Corriente'] || periodData?.balance_sheet?.['ActivoFijo'] || periodData?.balance_sheet?.['Activo Fijo']);
        
        const calculatedSum = ac + anc;
        if (calculatedSum > 0) {
            totalAssets = calculatedSum;
        } else {
            // Último recurso: sumar todo el balance sheet (asumiendo que solo tiene activos o que la suma total es lo que buscamos)
            totalAssets = calculateRecursiveTotal(periodData?.balance_sheet);
        }
    }

    // Buscar Ventas Netas
    let netSales = findValueByKey(periodData?.income_statement, 'Ventas Netas') || 
                   findValueByKey(periodData?.income_statement, 'Ventas Totales');
                   
    if (!netSales) {
        netSales = findValueByKey(periodData?.income_statement, 'Ventas') || 
                   findValueByKey(periodData?.income_statement, 'Ingresos');
                   
        if (!netSales) {
             const ventasGroup = periodData?.income_statement?.['VentasYVariantes'] || periodData?.income_statement?.['Ingresos'];
             if (ventasGroup) {
                 netSales = calculateRecursiveTotal(ventasGroup);
             }
        }
    }

    // Buscar Total Pasivos
    let totalLiabilities = findValueByKey(periodData?.balance_sheet, 'Total Pasivos') || 
                           findValueByKey(periodData?.balance_sheet, 'Total Pasivo') ||
                           findValueByKey(periodData?.balance_sheet, 'Total Liabilities');

    if (!totalLiabilities) {
        const pc = calculateRecursiveTotal(periodData?.balance_sheet?.['PasivosCortoPlazo'] || periodData?.balance_sheet?.['Pasivo Corriente'] || periodData?.balance_sheet?.['Pasivo Circulante']);
        const pnc = calculateRecursiveTotal(periodData?.balance_sheet?.['PasivoFijo'] || periodData?.balance_sheet?.['Pasivo No Corriente'] || periodData?.balance_sheet?.['Pasivo Largo Plazo'] || periodData?.balance_sheet?.['PasivoDiferido']);
        
        const calculatedSum = pc + pnc;
        if (calculatedSum > 0) {
            totalLiabilities = calculatedSum;
        }
    }

    // Buscar Total Capital / Patrimonio
    let totalEquity = findValueByKey(periodData?.balance_sheet, 'Total Capital') || 
                      findValueByKey(periodData?.balance_sheet, 'Total Patrimonio') ||
                      findValueByKey(periodData?.balance_sheet, 'Total Equity') ||
                      findValueByKey(periodData?.balance_sheet, 'Patrimonio Neto');

    if (!totalEquity) {
        const cc = calculateRecursiveTotal(periodData?.balance_sheet?.['CapitalContribuido'] || periodData?.balance_sheet?.['Capital Contribuido']);
        const cg = calculateRecursiveTotal(periodData?.balance_sheet?.['CapitalGanado'] || periodData?.balance_sheet?.['Capital Ganado']);
        
        const calculatedSum = cc + cg;
        if (calculatedSum > 0) {
            totalEquity = calculatedSum;
        }
    }

    periodTotals[period] = {
      totalAssets: totalAssets || 1, // Evitar división por cero
      netSales: netSales || 1,
      totalLiabilities: totalLiabilities || 0,
      totalEquity: totalEquity || 0
    };
  });

  const VerticalAnalysisTable = ({ type }: { type: 'balance' | 'income' }) => {
    let baseStructure = raw[currentPeriod]?.[type === 'balance' ? 'balance_sheet' : 'income_statement'];
    
    if (!baseStructure) return <div>No hay datos disponibles.</div>;

    // 1. Desempaquetar raíz si es un contenedor único (ej. "BalanceGeneral")
    const keys = Object.keys(baseStructure);
    if (keys.length === 1 && typeof baseStructure[keys[0]] === 'object') {
        baseStructure = baseStructure[keys[0]];
    }

    // Helper para ignorar llaves de totales en cálculos
    const isTotalKey = (key: string) => {
        const k = key.toLowerCase();
        return k.startsWith('total') || k.startsWith('suma') || k.startsWith('gran total');
    };

    // Helper mejorado para sumar recursivamente excluyendo totales explícitos
    const calculateSafeTotal = (data: any): number => {
        if (typeof data === 'number') return data;
        if (!data || typeof data !== 'object') return 0;
        
        let sum = 0;
        for (const key in data) {
            if (isTotalKey(key)) continue; // Ignorar totales pre-calculados por la IA

            if (typeof data[key] === 'object') {
                sum += calculateSafeTotal(data[key]);
            } else if (typeof data[key] === 'number') {
                sum += data[key];
            }
        }
        return sum;
    };

    // Helper para clasificar cuentas
    const classifyAccount = (key: string): 'asset' | 'liability' | 'equity' | 'unknown' => {
        const k = key.toLowerCase().replace(/[^a-z]/g, '');
        if (k.includes('activo') || k.includes('asset') || k.includes('caja') || k.includes('efectivo') || k.includes('banco') || k.includes('inversion') || k.includes('inventario') || k.includes('cliente') || k.includes('cobrar') || k.includes('propiedad') || k.includes('equipo') || k.includes('maquinaria')) return 'asset';
        if (k.includes('pasivo') || k.includes('liability') || k.includes('deuda') || k.includes('proveedor') || k.includes('acreedor') || k.includes('impuesto') || k.includes('pagar') || k.includes('obligacion')) return 'liability';
        if (k.includes('capital') || k.includes('patrimonio') || k.includes('equity') || k.includes('utilidad') || k.includes('resultado') || k.includes('reserva') || k.includes('ganancia') || k.includes('perdida')) return 'equity';
        return 'unknown';
    };

    // Helper para ordenar llaves según lógica contable
    const sortFinancialKeys = (keys: string[], groupType: 'asset' | 'liability' | 'equity' | 'unknown') => {
        return keys.sort((a, b) => {
            const normA = a.toLowerCase();
            const normB = b.toLowerCase();

            const getScore = (str: string) => {
                if (groupType === 'asset') {
                    if (str.includes('corriente') || str.includes('circulante') || str.includes('current')) return 1;
                    if (str.includes('fijo') || str.includes('no corriente') || str.includes('fixed')) return 2;
                    if (str.includes('diferido') || str.includes('deferred')) return 3;
                    if (str.includes('otro') || str.includes('other')) return 4;
                }
                if (groupType === 'liability') {
                    if (str.includes('corto') || str.includes('corriente') || str.includes('circulante') || str.includes('short')) return 1;
                    if (str.includes('largo') || str.includes('no corriente') || str.includes('fijo') || str.includes('long')) return 2;
                    if (str.includes('diferido') || str.includes('deferred')) return 3;
                    if (str.includes('otro') || str.includes('other')) return 4;
                }
                if (groupType === 'equity') {
                    if (str.includes('contribuido') || str.includes('social') || str.includes('contributed')) return 1;
                    if (str.includes('ganado') || str.includes('retenid') || str.includes('earned')) return 2;
                }
                return 99;
            };

            const scoreA = getScore(normA);
            const scoreB = getScore(normB);

            if (scoreA !== scoreB) return scoreA - scoreB;
            return a.localeCompare(b);
        });
    };

    const renderRows = (structure: any, depth = 0, path: string[] = []) => {
      // Filtrar llaves de totales para no renderizarlas como items normales
      const keysToRender = Object.keys(structure).filter(k => !isTotalKey(k));

      return keysToRender.map((key) => {
        const val = structure[key];
        const currentPath = [...path, key];
        const isGroup = typeof val === 'object' && val !== null && !Array.isArray(val);
        
        if (isGroup) {
          // Calcular totales para este grupo
          const groupTotals = rawPeriods.reduce((acc, period) => {
            let groupData: any = raw[period]?.[type === 'balance' ? 'balance_sheet' : 'income_statement'];
            
            // Re-navegación segura:
            let validPath = true;
            if (raw[period]) {
                let currentRoot = raw[period][type === 'balance' ? 'balance_sheet' : 'income_statement'];
                const rootKeys = Object.keys(currentRoot || {});
                if (rootKeys.length === 1 && typeof currentRoot[rootKeys[0]] === 'object') {
                    currentRoot = currentRoot[rootKeys[0]];
                }

                let ptr = currentRoot;
                for (const p of currentPath) {
                    if (ptr && typeof ptr === 'object' && p in ptr) {
                        ptr = ptr[p];
                    } else {
                        validPath = false;
                        break;
                    }
                }
                groupData = ptr;
            } else {
                validPath = false;
            }

            acc[period] = validPath ? calculateSafeTotal(groupData) : 0;
            return acc;
          }, {} as Record<string, number>);

          return (
            <Fragment key={key}>
              <TableRow className="hover:bg-muted/50">
                <TableCell style={{ paddingLeft: `${(depth * 1.5) + 1}rem` }} className="font-bold text-primary" colSpan={1 + (rawPeriods.length * 2)}>
                  {key}
                </TableCell>
              </TableRow>
              
              {renderRows(val, depth + 1, currentPath)}
              
              <TableRow className="bg-muted/30 font-semibold border-t">
                <TableCell style={{ paddingLeft: `${(depth * 1.5) + 1}rem` }}>
                  Total {key}
                </TableCell>
                {rawPeriods.map(period => {
                  const value = groupTotals[period] || 0;
                  const base = type === 'balance' ? periodTotals[period].totalAssets : periodTotals[period].netSales;
                  const percentage = base ? (value / base) * 100 : 0;
                  
                  return (
                    <Fragment key={period}>
                      <TableCell className="text-right font-mono text-sm">
                        {formatCurrency(value)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-muted-foreground border-r">
                        {formatSimplePercent(percentage)}
                      </TableCell>
                    </Fragment>
                  );
                })}
              </TableRow>
            </Fragment>
          );
        }

        // Renderizar item hoja
        return (
          <TableRow key={key} className="hover:bg-muted/50">
            <TableCell style={{ paddingLeft: `${(depth * 1.5) + 1}rem` }} className="font-medium">
              {key}
            </TableCell>
            {rawPeriods.map(period => {
              let value: any = 0;
              if (raw[period]) {
                  let currentRoot = raw[period][type === 'balance' ? 'balance_sheet' : 'income_statement'];
                  const rootKeys = Object.keys(currentRoot || {});
                  if (rootKeys.length === 1 && typeof currentRoot[rootKeys[0]] === 'object') {
                      currentRoot = currentRoot[rootKeys[0]];
                  }
                  
                  let ptr = currentRoot;
                  let found = true;
                  for (const p of currentPath) {
                      if (ptr && typeof ptr === 'object' && p in ptr) {
                          ptr = ptr[p];
                      } else {
                          found = false;
                          break;
                      }
                  }
                  value = found ? ptr : 0;
              }

              const numValue = (typeof value === 'number') ? value : 0;
              const base = type === 'balance' ? periodTotals[period].totalAssets : periodTotals[period].netSales;
              const percentage = base ? (numValue / base) * 100 : 0;

              return (
                <Fragment key={period}>
                  <TableCell className="text-right font-mono text-sm">
                    {formatCurrency(numValue)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm text-muted-foreground border-r">
                    {formatSimplePercent(percentage)}
                  </TableCell>
                </Fragment>
              );
            })}
          </TableRow>
        );
      });
    };

    if (type === 'balance') {
        const allKeys = Object.keys(baseStructure).filter(k => !isTotalKey(k));
        const assets = sortFinancialKeys(allKeys.filter(k => classifyAccount(k) === 'asset'), 'asset');
        const liabilities = sortFinancialKeys(allKeys.filter(k => classifyAccount(k) === 'liability'), 'liability');
        const equity = sortFinancialKeys(allKeys.filter(k => classifyAccount(k) === 'equity'), 'equity');
        const others = sortFinancialKeys(allKeys.filter(k => classifyAccount(k) === 'unknown'), 'unknown');

        // Calcular totales dinámicos
        const calculatedTotals = rawPeriods.reduce((acc, period) => {
            let periodData = raw[period]?.balance_sheet || {};
            const rootKeys = Object.keys(periodData);
            if (rootKeys.length === 1 && typeof periodData[rootKeys[0]] === 'object') {
                periodData = periodData[rootKeys[0]];
            }

            const sumKeys = (keysToSum: string[]) => keysToSum.reduce((sum, key) => {
                return sum + calculateSafeTotal(periodData[key]);
            }, 0);

            acc[period] = {
                assets: sumKeys(assets) + sumKeys(others),
                liabilities: sumKeys(liabilities),
                equity: sumKeys(equity)
            };
            return acc;
        }, {} as Record<string, { assets: number; liabilities: number; equity: number }>);

        return (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">Cuenta</TableHead>
                    {rawPeriods.map(period => (
                      <TableHead key={period} colSpan={2} className="text-center border-r border-b bg-muted/30">{period}</TableHead>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableHead className="border-b"></TableHead>
                    {rawPeriods.map(period => (
                      <Fragment key={period}>
                        <TableHead className="text-right text-xs border-b">Valor</TableHead>
                        <TableHead className="text-right text-xs border-r border-b">%</TableHead>
                      </Fragment>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* ACTIVOS */}
                  {assets.map(key => renderRows({ [key]: baseStructure[key] }))}
                  {others.map(key => renderRows({ [key]: baseStructure[key] }))}
                  
                  <TableRow className="bg-muted/40 font-bold border-t-2 border-primary/20">
                    <TableCell>TOTAL ACTIVOS</TableCell>
                    {rawPeriods.map(period => (
                        <Fragment key={period}>
                            <TableCell className="text-right font-mono text-sm">{formatCurrency(calculatedTotals[period].assets)}</TableCell>
                            <TableCell className="text-right font-mono text-sm text-muted-foreground border-r">100.00%</TableCell>
                        </Fragment>
                    ))}
                  </TableRow>

                  <TableRow><TableCell colSpan={1 + (rawPeriods.length * 2)} className="h-4"></TableCell></TableRow>

                  {/* PASIVOS */}
                  {liabilities.map(key => renderRows({ [key]: baseStructure[key] }))}
                  
                  <TableRow className="bg-muted/40 font-bold border-t-2 border-primary/20">
                    <TableCell>TOTAL PASIVOS</TableCell>
                    {rawPeriods.map(period => {
                        const val = calculatedTotals[period].liabilities;
                        const base = calculatedTotals[period].assets;
                        return (
                            <Fragment key={period}>
                                <TableCell className="text-right font-mono text-sm">{formatCurrency(val)}</TableCell>
                                <TableCell className="text-right font-mono text-sm text-muted-foreground border-r">{formatSimplePercent(base ? (val/base)*100 : 0)}</TableCell>
                            </Fragment>
                        );
                    })}
                  </TableRow>

                  <TableRow><TableCell colSpan={1 + (rawPeriods.length * 2)} className="h-4"></TableCell></TableRow>

                  {/* CAPITAL */}
                  {equity.map(key => renderRows({ [key]: baseStructure[key] }))}

                  <TableRow className="bg-muted/40 font-bold border-t-2 border-primary/20">
                    <TableCell>TOTAL CAPITAL</TableCell>
                    {rawPeriods.map(period => {
                        const val = calculatedTotals[period].equity;
                        const base = calculatedTotals[period].assets;
                        return (
                            <Fragment key={period}>
                                <TableCell className="text-right font-mono text-sm">{formatCurrency(val)}</TableCell>
                                <TableCell className="text-right font-mono text-sm text-muted-foreground border-r">{formatSimplePercent(base ? (val/base)*100 : 0)}</TableCell>
                            </Fragment>
                        );
                    })}
                  </TableRow>

                  {/* TOTAL PASIVO + CAPITAL */}
                  <TableRow className="bg-primary/10 font-bold border-t-4 border-double border-primary mt-4">
                    <TableCell>TOTAL PASIVO + CAPITAL</TableCell>
                    {rawPeriods.map(period => {
                        const val = calculatedTotals[period].liabilities + calculatedTotals[period].equity;
                        const base = calculatedTotals[period].assets;
                        return (
                            <Fragment key={period}>
                                <TableCell className="text-right font-mono text-sm">{formatCurrency(val)}</TableCell>
                                <TableCell className="text-right font-mono text-sm text-muted-foreground border-r">{formatSimplePercent(base ? (val/base)*100 : 0)}</TableCell>
                            </Fragment>
                        );
                    })}
                  </TableRow>
                </TableBody>
              </Table>
            </div>
        );
    }

    // Default render for Income Statement
    return (
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Cuenta</TableHead>
              {rawPeriods.map(period => (
                <TableHead key={period} colSpan={2} className="text-center border-r border-b bg-muted/30">{period}</TableHead>
              ))}
            </TableRow>
            <TableRow>
              <TableHead className="border-b"></TableHead>
              {rawPeriods.map(period => (
                <Fragment key={period}>
                  <TableHead className="text-right text-xs border-b">Valor</TableHead>
                  <TableHead className="text-right text-xs border-r border-b">%</TableHead>
                </Fragment>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {renderRows(baseStructure)}
          </TableBody>
        </Table>
      </div>
    );
  };


  // Helper para renderizar razón financiera (sin cambios)
  const renderRatio = (title: string, formula: string, value: any, benchmark: string, analysis: string) => {
    const numValue = value?.valor || 0;
    return (
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Fórmula: {formula}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-semibold">Valor Calculado:</span>
            <span className="text-2xl font-bold text-primary">
              {typeof numValue === 'number' && numValue < 1 && numValue > 0 ? formatPercent(numValue) : formatNumber(numValue)}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Promedio Industrial:</span>
            <span className="font-medium">{benchmark}</span>
          </div>
          <div className="p-3 bg-muted/50 rounded-md text-sm">
            <p className="font-medium mb-1 flex items-center">
              <Info className="h-4 w-4 mr-1" />
              Análisis:
            </p>
            <p className="text-muted-foreground">{analysis}</p>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Renderizar jerarquía de datos fuente (Legacy - para Datos Fuente tab)
  const renderSourceData = (data: any, indent: number = 0): JSX.Element[] => {
    if (!data || typeof data !== 'object') {
      return [];
    }

    return Object.entries(data).map(([key, value], index) => {
      const isObject = typeof value === 'object' && value !== null && !Array.isArray(value);
      const isNumeric = typeof value === 'number';

      return (
        <div key={`${key}-${index}`} style={{ marginLeft: `${indent * 20}px` }} className="border-l-2 border-muted pl-4 py-1">
          <div className="flex justify-between items-center py-1">
            <span className={isObject ? "font-semibold text-primary" : "text-muted-foreground"}>
              {key}
            </span>
            {isNumeric && (
              <span className="font-mono text-sm">{formatCurrency(value as number)}</span>
            )}
          </div>
          {isObject && <>{renderSourceData(value, indent + 1)}</>}
        </div>
      );
    });
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Análisis Financiero Detallado</h1>
          <p className="text-muted-foreground">Periodo Base: {currentPeriod}</p>
        </div>
        <Button variant="outline" onClick={() => onNavigate('import')}>
          <FileText className="mr-2 h-4 w-4" />
          Nueva Importación
        </Button>
      </div>

      <Tabs defaultValue="balance-general" className="w-full">
        <TabsList className="flex w-full overflow-x-auto h-auto p-1 space-x-2 bg-muted/50 rounded-lg">
          <TabsTrigger value="balance-general" className="flex-1 min-w-[140px]">Balance General</TabsTrigger>
          <TabsTrigger value="estado-resultado" className="flex-1 min-w-[140px]">Estado de Resultado</TabsTrigger>
          <TabsTrigger value="razones" className="flex-1 min-w-[140px]">Razones Financieras</TabsTrigger>
          <TabsTrigger value="source" className="flex-1 min-w-[100px]">Datos Fuente</TabsTrigger>
        </TabsList>

        {/* BALANCE GENERAL */}
        <TabsContent value="balance-general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Análisis Vertical - Balance General</CardTitle>
              <CardDescription>
                Cada cuenta se presenta como porcentaje del Total de Activos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="mb-6">
                <Info className="h-4 w-4" />
                <AlertTitle>Interpretación</AlertTitle>
                <AlertDescription>
                  El porcentaje indica la proporción que representa cada cuenta respecto al Total de Activos (100%).
                </AlertDescription>
              </Alert>
              
              <VerticalAnalysisTable type="balance" />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ESTADO DE RESULTADO */}
        <TabsContent value="estado-resultado" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Análisis Vertical - Estado de Resultados</CardTitle>
              <CardDescription>
                Cada cuenta se presenta como porcentaje de las Ventas Netas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="mb-6">
                <Info className="h-4 w-4" />
                <AlertTitle>Interpretación</AlertTitle>
                <AlertDescription>
                  El porcentaje indica la proporción de cada ingreso o gasto respecto a las Ventas Totales (100%).
                </AlertDescription>
              </Alert>
              
              <VerticalAnalysisTable type="income" />
            </CardContent>
          </Card>
        </TabsContent>

        {/* RAZONES FINANCIERAS */}
        <TabsContent value="razones" className="space-y-6">
          {/* 1. RAZONES DE LIQUIDEZ */}
          <Card>
            <CardHeader className="bg-primary/5">
              <CardTitle className="text-2xl">1. Razones de Liquidez</CardTitle>
              <CardDescription>Capacidad de la empresa para cumplir con obligaciones a corto plazo</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {renderRatio(
                "Capital Neto de Trabajo",
                "Activos Circulantes - Pasivos Circulantes",
                analysis?.liquidez?.capitalNetoTrabajo,
                "Positivo (mayor que 0)",
                "Lo ideal es que el activo circulante sea mayor que el pasivo circulante, ya que el excedente puede ser utilizado en la generación de más utilidades."
              )}

              {renderRatio(
                "Razón Circulante o Índice de Solvencia",
                "Activos Circulantes / Pasivo Circulante",
                analysis?.liquidez?.razonCirculante,
                "1.5 - 2.0",
                "Indica en qué medida los pasivos circulantes están cubiertos por los activos que se espera que se conviertan en efectivo en el futuro cercano. Un valor superior a 1.0 sugiere que la empresa tiene suficiente capacidad para cubrir sus pasivos inmediatos."
              )}

              {renderRatio(
                "Razón Rápida (Prueba Ácida)",
                "(Activos Circulantes - Inventarios) / Pasivo Circulante",
                analysis?.liquidez?.razonRapida,
                "1.0",
                "La razón rápida mide la capacidad de la empresa para cubrir sus pasivos circulantes con sus activos más líquidos, excluyendo los inventarios. Un valor satisfactorio es 1.0, pero este puede variar según el tipo de negocio. Una razón más alta indica mayor solvencia."
              )}
            </CardContent>
          </Card>

          {/* 2. RAZONES DE ACTIVIDAD */}
          <Card>
            <CardHeader className="bg-primary/5">
              <CardTitle className="text-2xl">2. Razones de Actividad</CardTitle>
              <CardDescription>Eficiencia en el uso y gestión de activos</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {renderRatio(
                "Rotación de Inventarios",
                "Costo de Bienes Vendidos / Inventarios Promedio",
                analysis?.actividad?.rotacionInventario,
                "5 - 10",
                "La rotación de inventarios muestra la eficiencia de la empresa en la venta y reposición de inventarios. Un valor más alto indica que los inventarios se están utilizando más rápidamente."
              )}

              {renderRatio(
                "Rotación de Cuentas por Cobrar",
                "Ventas al crédito / Cuentas por Cobrar Promedio",
                analysis?.actividad?.rotacionCuentasCobrar,
                "6 - 12",
                "La rotación de cuentas por cobrar mide la eficacia de la empresa en la gestión de cobros. Un valor alto indica que la empresa cobra rápidamente a sus clientes."
              )}

              {renderRatio(
                "Periodo Promedio de Cobro",
                "360 / Rotación de Cuentas por Cobrar",
                analysis?.actividad?.periodoPromedioCobro,
                "30 - 45 días",
                "El periodo promedio de cobro indica el tiempo promedio que tarda la empresa en cobrar sus cuentas por cobrar. Un valor menor es generalmente más favorable."
              )}

              {renderRatio(
                "Rotación de Activos Fijos",
                "Ventas / Activos Fijos Promedio",
                analysis?.actividad?.rotacionActivosFijos,
                "5 - 8",
                "La rotación de activos fijos muestra cuán eficientemente la empresa utiliza sus activos fijos para generar ventas. Un valor más alto indica mayor eficiencia."
              )}

              {renderRatio(
                "Rotación de Activos Totales",
                "Ventas / Activos Totales Promedio",
                analysis?.actividad?.rotacionActivosTotales,
                "1.0 - 2.5",
                "La rotación de activos totales mide la eficacia con la que una empresa utiliza todos sus activos para generar ventas. Un valor más alto indica mayor eficiencia."
              )}
            </CardContent>
          </Card>

          {/* 3. RAZONES DE ENDEUDAMIENTO */}
          <Card>
            <CardHeader className="bg-primary/5">
              <CardTitle className="text-2xl">3. Razones de Endeudamiento</CardTitle>
              <CardDescription>Estructura de capital y capacidad de pago de deudas</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {renderRatio(
                "Razón de Endeudamiento o Deuda",
                "Total Pasivos / Total Activos",
                analysis?.endeudamiento?.razonEndeudamiento,
                "0.3 - 0.5 (30% - 50%)",
                "La razón de endeudamiento indica el porcentaje de los activos que está financiado con deuda. Un valor más alto implica un mayor riesgo de insolvencia. Un valor bajo es generalmente favorable, ya que indica menos dependencia de la deuda."
              )}

              {renderRatio(
                "Razón Pasivo / Capital",
                "Total Pasivos / Patrimonio Neto",
                analysis?.endeudamiento?.razonPasivoCapital,
                "0.5 - 1.0",
                "Esta razón indica la proporción de los activos financiados por deuda frente al capital propio. Un valor más bajo es generalmente preferido."
              )}

              {renderRatio(
                "Rotación de Intereses a Utilidades",
                "Utilidad Operativa / Gasto por Intereses",
                analysis?.endeudamiento?.rotacionInteresesUtilidades,
                "3 - 5",
                "Esta razón mide la capacidad de la empresa para cubrir sus gastos por intereses con su utilidad operativa. Un valor mayor indica mayor capacidad de pago de intereses."
              )}
            </CardContent>
          </Card>

          {/* 4. RAZONES DE RENTABILIDAD */}
          <Card>
            <CardHeader className="bg-primary/5">
              <CardTitle className="text-2xl">4. Razones de Rentabilidad</CardTitle>
              <CardDescription>Capacidad de generar utilidades y retornos sobre inversión</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {renderRatio(
                "Margen de Utilidad Bruta (MUB)",
                "Utilidad Bruta / Ventas",
                analysis?.rentabilidad?.margenUtilidadBruta,
                "20% - 40%",
                "El margen de utilidad bruta muestra la rentabilidad de la empresa antes de los gastos operativos. Un valor más alto indica una mayor rentabilidad en la producción."
              )}

              {renderRatio(
                "Margen de Utilidad Operativa (MUO)",
                "Utilidad Operativa / Ventas",
                analysis?.rentabilidad?.margenUtilidadOperativa,
                "10% - 20%",
                "El margen de utilidad operativa mide la rentabilidad de la empresa antes de los gastos financieros e impuestos. Un margen más alto es generalmente favorable."
              )}

              {renderRatio(
                "Margen de Utilidad Neta",
                "Utilidad Neta / Ventas",
                analysis?.rentabilidad?.margenUtilidadNeta,
                "5% - 10%",
                "El margen de utilidad neta mide la rentabilidad final de la empresa, después de todos los gastos, impuestos e intereses. Un margen más alto indica una mayor rentabilidad para los accionistas."
              )}

              {renderRatio(
                "Rentabilidad sobre el Activo (ROA)",
                "Utilidad Neta / Total Activos",
                analysis?.rentabilidad?.roa,
                "5% - 10%",
                "La rentabilidad sobre el activo mide la eficacia de la empresa para generar utilidades a partir de sus activos totales. Un ROA más alto indica una mayor eficiencia en el uso de los activos."
              )}

              {analysis?.rentabilidad?.roe && renderRatio(
                "Rentabilidad sobre el Patrimonio (ROE)",
                "Utilidad Neta / Patrimonio",
                analysis?.rentabilidad?.roe,
                "15% - 20%",
                "La rentabilidad sobre el patrimonio mide el retorno que obtienen los accionistas sobre su inversión. Un ROE más alto indica una mayor rentabilidad para los propietarios."
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* DATOS FUENTE */}
        <TabsContent value="source" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Datos Fuente</CardTitle>
              <CardDescription>Datos financieros importados y procesados por la IA</CardDescription>
            </CardHeader>
            <CardContent>
              {raw && rawPeriods.length > 0 ? (
                <Tabs defaultValue={rawPeriods[0]} className="w-full">
                  <TabsList className="flex w-full overflow-x-auto">
                    {rawPeriods.map(period => (
                      <TabsTrigger key={period} value={period}>
                        {period}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {rawPeriods.map(period => (
                    <TabsContent key={period} value={period} className="space-y-4">
                      {raw[period]?.balance_sheet && (
                        <div>
                          <h3 className="text-lg font-semibold mb-2">Balance General</h3>
                          {renderSourceData(raw[period].balance_sheet)}
                        </div>
                      )}
                      {raw[period]?.income_statement && (
                        <div className="mt-6">
                          <h3 className="text-lg font-semibold mb-2">Estado de Resultados</h3>
                          {renderSourceData(raw[period].income_statement)}
                        </div>
                      )}
                    </TabsContent>
                  ))}
                </Tabs>
              ) : (
                <div className="text-muted-foreground">No hay datos fuente disponibles</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
