import { useState, useEffect, Fragment, JSX } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { AlertCircle, FileText, Info, ArrowRightLeft } from "lucide-react";
import { Button } from "./ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";

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
  const [viewMode, setViewMode] = useState<'vertical' | 'horizontal'>('vertical');

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
  const horizontalAnalysis = analysisData.analysis?.horizontalAnalysis;
  const capitalNetoOperativo = analysisData.analysis?.otros?.capitalNetoOperativo;
  const acPercent = analysisData.analysis?.otros?.acPercent;
  const pcPercent = analysisData.analysis?.otros?.pcPercent;

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

  // Identificar periodos disponibles
  const rawPeriods = Object.keys(raw).sort().reverse();
  const previousPeriod = rawPeriods[1];

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
        const ac = calculateRecursiveTotal(periodData?.balance_sheet?.['ActivoCorriente'] || periodData?.balance_sheet?.['Activo Corriente']);
        const anc = calculateRecursiveTotal(periodData?.balance_sheet?.['ActivoNoCorriente'] || periodData?.balance_sheet?.['Activo No Corriente'] || periodData?.balance_sheet?.['ActivoFijo'] || periodData?.balance_sheet?.['Activo Fijo']);
        
        const calculatedSum = ac + anc;
        if (calculatedSum > 0) {
            totalAssets = calculatedSum;
        } else {
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

  const HorizontalAnalysisTable = ({ type }: { type: 'balance' | 'income' }) => {
      const data = horizontalAnalysis?.[type === 'balance' ? 'balance_sheet' : 'income_statement'];
      
      if (!data || !previousPeriod) return <div className="p-4 text-center text-muted-foreground">Se requieren al menos 2 periodos para el análisis horizontal.</div>;

      const renderRows = (structure: any, depth = 0) => {
          return Object.keys(structure).map(key => {
              const item = structure[key];
              const isLeaf = item && typeof item.abs === 'number';
              
              if (!isLeaf) {
                  return (
                      <Fragment key={key}>
                          <TableRow className="hover:bg-muted/50 bg-muted/20">
                              <TableCell style={{ paddingLeft: `${(depth * 1.5) + 1}rem` }} className="font-bold text-primary" colSpan={5}>
                                  {key}
                              </TableCell>
                          </TableRow>
                          {renderRows(item, depth + 1)}
                      </Fragment>
                  );
              }

              return (
                  <TableRow key={key} className="hover:bg-muted/50">
                      <TableCell style={{ paddingLeft: `${(depth * 1.5) + 1}rem` }} className="font-medium">
                          {key}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                          {formatCurrency(item.value)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-muted-foreground">
                          {formatCurrency(item.value - item.abs)}
                      </TableCell>
                      <TableCell className={`text-right font-mono text-sm ${item.abs >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(item.abs)}
                      </TableCell>
                      <TableCell className={`text-right font-mono text-sm border-r ${item.rel >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatSimplePercent(item.rel)}
                      </TableCell>
                  </TableRow>
              );
          });
      };

      return (
          <div className="rounded-md border overflow-x-auto">
              <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead className="w-[300px]">Cuenta</TableHead>
                          <TableHead className="text-right">{currentPeriod}</TableHead>
                          <TableHead className="text-right text-muted-foreground">{previousPeriod}</TableHead>
                          <TableHead className="text-right">Var. Absoluta</TableHead>
                          <TableHead className="text-right border-r">Var. Relativa</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {renderRows(data)}
                  </TableBody>
              </Table>
          </div>
      );
  };

  const VerticalAnalysisTable = ({ type }: { type: 'balance' | 'income' }) => {
    let baseStructure = raw[currentPeriod]?.[type === 'balance' ? 'balance_sheet' : 'income_statement'];
    
    if (!baseStructure) return <div>No hay datos disponibles.</div>;

    const keys = Object.keys(baseStructure);
    if (keys.length === 1 && typeof baseStructure[keys[0]] === 'object') {
        baseStructure = baseStructure[keys[0]];
    }

    const isTotalKey = (key: string) => {
        const k = key.toLowerCase();
        return k.startsWith('total') || k.startsWith('suma') || k.startsWith('gran total');
    };

    const calculateSafeTotal = (data: any): number => {
        if (typeof data === 'number') return data;
        if (!data || typeof data !== 'object') return 0;
        
        let sum = 0;
        for (const key in data) {
            if (isTotalKey(key)) continue;
            if (typeof data[key] === 'object') {
                sum += calculateSafeTotal(data[key]);
            } else if (typeof data[key] === 'number') {
                sum += data[key];
            }
        }
        return sum;
    };

    const classifyAccount = (key: string): 'asset' | 'liability' | 'equity' | 'unknown' => {
        const k = key.toLowerCase().replace(/[^a-z]/g, '');
        if (k.includes('activo') || k.includes('asset') || k.includes('caja') || k.includes('efectivo') || k.includes('banco') || k.includes('inversion') || k.includes('inventario') || k.includes('cliente') || k.includes('cobrar') || k.includes('propiedad') || k.includes('equipo') || k.includes('maquinaria')) return 'asset';
        if (k.includes('pasivo') || k.includes('liability') || k.includes('deuda') || k.includes('proveedor') || k.includes('acreedor') || k.includes('impuesto') || k.includes('pagar') || k.includes('obligacion')) return 'liability';
        if (k.includes('capital') || k.includes('patrimonio') || k.includes('equity') || k.includes('utilidad') || k.includes('resultado') || k.includes('reserva') || k.includes('ganancia') || k.includes('perdida')) return 'equity';
        return 'unknown';
    };

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

    const renderRows = (structure: any, depth = 0, path: string[] = [], customBaseMap?: Record<string, number>) => {
      const keysToRender = Object.keys(structure).filter(k => !isTotalKey(k));

      return keysToRender.map((key) => {
        const val = structure[key];
        const currentPath = [...path, key];
        const isGroup = typeof val === 'object' && val !== null && !Array.isArray(val);
        
        if (isGroup) {
          const groupTotals = type === 'balance' ? rawPeriods.reduce((acc, period) => {
            let groupData: any = raw[period]?.[type === 'balance' ? 'balance_sheet' : 'income_statement'];
            
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
          }, {} as Record<string, number>) : {};

          return (
            <Fragment key={key}>
              <TableRow className="hover:bg-muted/50">
                <TableCell style={{ paddingLeft: `${(depth * 1.5) + 1}rem` }} className="font-bold text-primary" colSpan={1 + (rawPeriods.length * 2)}>
                  {key}
                </TableCell>
              </TableRow>
              
              {renderRows(val, depth + 1, currentPath, customBaseMap)}
              
              {type === 'balance' && (
                <TableRow className="bg-muted/30 font-semibold border-t">
                  <TableCell style={{ paddingLeft: `${(depth * 1.5) + 1}rem` }}>
                    Total {key}
                  </TableCell>
                  {rawPeriods.map(period => {
                    const value = groupTotals[period] || 0;
                    const base = customBaseMap ? customBaseMap[period] : periodTotals[period].totalAssets;
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
              )}
            </Fragment>
          );
        }

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
              const base = customBaseMap ? customBaseMap[period] : (type === 'balance' ? periodTotals[period].totalAssets : periodTotals[period].netSales);
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

        const assetBaseMap = rawPeriods.reduce((acc, p) => ({ ...acc, [p]: calculatedTotals[p].assets }), {});
        const liabilityEquityBaseMap = rawPeriods.reduce((acc, p) => ({ ...acc, [p]: calculatedTotals[p].liabilities + calculatedTotals[p].equity }), {});

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
                  {assets.map(key => renderRows({ [key]: baseStructure[key] }, 0, [], assetBaseMap))}
                  {others.map(key => renderRows({ [key]: baseStructure[key] }, 0, [], assetBaseMap))}
                  
                  <TableRow className="bg-muted/40 font-bold border-t-2 border-primary/20">
                    <TableCell>TOTAL ACTIVOS</TableCell>
                    {rawPeriods.map(period => (
                        <Fragment key={period}>
                            <TableCell className="text-right font-mono text-sm">{formatCurrency(calculatedTotals[period].assets)}</TableCell>
                            <TableCell className="text-right font-mono text-sm text-muted-foreground border-r">100.00%</TableCell>
                        </Fragment>
                    ))}
                  </TableRow>

                  {liabilities.map(key => renderRows({ [key]: baseStructure[key] }, 0, [], liabilityEquityBaseMap))}
                  
                  <TableRow className="bg-muted/40 font-bold border-t-2 border-primary/20">
                    <TableCell>TOTAL PASIVOS</TableCell>
                    {rawPeriods.map(period => (
                        <Fragment key={period}>
                            <TableCell className="text-right font-mono text-sm">{formatCurrency(calculatedTotals[period].liabilities)}</TableCell>
                            <TableCell className="text-right font-mono text-sm text-muted-foreground border-r">
                                {formatSimplePercent((calculatedTotals[period].liabilities / (calculatedTotals[period].liabilities + calculatedTotals[period].equity)) * 100)}
                            </TableCell>
                        </Fragment>
                    ))}
                  </TableRow>

                  {equity.map(key => renderRows({ [key]: baseStructure[key] }, 0, [], liabilityEquityBaseMap))}

                  <TableRow className="bg-muted/40 font-bold border-t-2 border-primary/20">
                    <TableCell>TOTAL CAPITAL</TableCell>
                    {rawPeriods.map(period => (
                        <Fragment key={period}>
                            <TableCell className="text-right font-mono text-sm">{formatCurrency(calculatedTotals[period].equity)}</TableCell>
                            <TableCell className="text-right font-mono text-sm text-muted-foreground border-r">
                                {formatSimplePercent((calculatedTotals[period].equity / (calculatedTotals[period].liabilities + calculatedTotals[period].equity)) * 100)}
                            </TableCell>
                        </Fragment>
                    ))}
                  </TableRow>

                  <TableRow className="bg-primary/10 font-bold border-t-4 border-double border-primary">
                    <TableCell>TOTAL PASIVO + CAPITAL</TableCell>
                    {rawPeriods.map(period => (
                        <Fragment key={period}>
                            <TableCell className="text-right font-mono text-sm">{formatCurrency(calculatedTotals[period].liabilities + calculatedTotals[period].equity)}</TableCell>
                            <TableCell className="text-right font-mono text-sm text-muted-foreground border-r">100.00%</TableCell>
                        </Fragment>
                    ))}
                  </TableRow>

                </TableBody>
              </Table>
            </div>
        );
    }

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
        <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-muted p-2 rounded-lg">
                <Switch 
                    id="view-mode" 
                    checked={viewMode === 'horizontal'}
                    onCheckedChange={(checked: any) => setViewMode(checked ? 'horizontal' : 'vertical')}
                />
                <Label htmlFor="view-mode" className="cursor-pointer font-medium">
                    {viewMode === 'horizontal' ? 'Análisis Horizontal' : 'Análisis Vertical'}
                </Label>
            </div>
            <Button variant="outline" onClick={() => onNavigate('import')}>
            <FileText className="mr-2 h-4 w-4" />
            Nueva Importación
            </Button>
        </div>
      </div>

      <Tabs defaultValue="balance-general" className="w-full">
        <TabsList className="flex w-full overflow-x-auto h-auto p-1 space-x-2 bg-muted/50 rounded-lg">
          <TabsTrigger value="balance-general" className="flex-1 min-w-[140px]">Balance General</TabsTrigger>
          <TabsTrigger value="estado-resultado" className="flex-1 min-w-[140px]">Estado de Resultado</TabsTrigger>
          <TabsTrigger value="razones" className="flex-1 min-w-[140px]">Razones Financieras</TabsTrigger>
          <TabsTrigger value="source" className="flex-1 min-w-[100px]">Datos Fuente</TabsTrigger>
        </TabsList>

        <TabsContent value="balance-general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{viewMode === 'horizontal' ? 'Análisis Horizontal' : 'Análisis Vertical'} - Balance General</CardTitle>
              <CardDescription>
                {viewMode === 'horizontal' 
                    ? 'Comparación de variaciones absolutas y relativas entre periodos.' 
                    : 'Cada cuenta se presenta como porcentaje del Total de Activos.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {viewMode === 'vertical' && (
                  <Alert className="mb-6">
                    <Info className="h-4 w-4" />
                    <AlertTitle>Interpretación</AlertTitle>
                    <AlertDescription>
                      El porcentaje indica la proporción que representa cada cuenta respecto al Total de Activos (100%).
                    </AlertDescription>
                  </Alert>
              )}
              
              {viewMode === 'horizontal' ? (
                  <HorizontalAnalysisTable type="balance" />
              ) : (
                  <VerticalAnalysisTable type="balance" />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="estado-resultado" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{viewMode === 'horizontal' ? 'Análisis Horizontal' : 'Análisis Vertical'} - Estado de Resultados</CardTitle>
              <CardDescription>
                {viewMode === 'horizontal' 
                    ? 'Comparación de variaciones absolutas y relativas entre periodos.' 
                    : 'Cada cuenta se presenta como porcentaje de las Ventas Netas.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {viewMode === 'vertical' && (
                  <Alert className="mb-6">
                    <Info className="h-4 w-4" />
                    <AlertTitle>Interpretación</AlertTitle>
                    <AlertDescription>
                      El porcentaje indica la proporción de cada ingreso o gasto respecto a las Ventas Totales (100%).
                    </AlertDescription>
                  </Alert>
              )}
              
              {viewMode === 'horizontal' ? (
                  <HorizontalAnalysisTable type="income" />
              ) : (
                  <VerticalAnalysisTable type="income" />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="razones" className="space-y-6">
          <Card>
            <CardHeader className="bg-primary/5">
              <CardTitle className="text-2xl">Capital Neto Operativo</CardTitle>
              <CardDescription>Cálculo basado en porcentajes de Activo y Pasivo Corriente</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="p-4 bg-muted rounded-lg text-center">
                        <p className="text-sm text-muted-foreground mb-1">AC% (Activo Cte / Total Activo)</p>
                        <p className="text-xl font-bold">{formatSimplePercent(acPercent)}</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg text-center">
                        <p className="text-sm text-muted-foreground mb-1">PC% (Pasivo Cte / Total Pasivo+Capital)</p>
                        <p className="text-xl font-bold">{formatSimplePercent(pcPercent)}</p>
                    </div>
                    <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg text-center">
                        <p className="text-sm text-primary font-semibold mb-1">Capital Neto Operativo (AC% - PC%)</p>
                        <p className="text-2xl font-bold text-primary">{formatSimplePercent(capitalNetoOperativo)}</p>
                    </div>
                </div>
                <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Fórmula Utilizada</AlertTitle>
                    <AlertDescription>
                        Capital Neto Operativo = AC% - PC% <br/>
                        Donde AC% es el porcentaje de Activos Corrientes respecto al Activo Total, y PC% es el porcentaje de Pasivos Corrientes respecto al Total Pasivo + Capital.
                    </AlertDescription>
                </Alert>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="bg-primary/5">
              <CardTitle className="text-2xl">1. Razones de Liquidez</CardTitle>
              <CardDescription>Capacidad de la empresa para cumplir con obligaciones a corto plazo</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {renderRatio(
                "Capital Neto de Trabajo",
                "Activos Circulantes – Pasivos Circulantes",
                analysis?.liquidez?.capitalNetoTrabajo,
                "Positivo (mayor que 0)",
                "Lo ideal es que el activo circulante sea mayor que el pasivo circulante, ya que el excedente puede ser utilizado en la generación de más utilidades."
              )}

              {renderRatio(
                "Razón Circulante (Índice de Solvencia)",
                "Activos Circulantes / Pasivo Circulante",
                analysis?.liquidez?.razonCirculante,
                "1.5 - 2.0",
                "Indica en qué medida los pasivos circulantes están cubiertos por los activos que se espera que se conviertan en efectivo en el futuro cercano. Un valor superior a 1.0 sugiere que la empresa tiene suficiente capacidad para cubrir sus pasivos inmediatos."
              )}

              {renderRatio(
                "Razón Rápida",
                "(Activos Circulantes – Inventarios) / Pasivo Circulante",
                analysis?.liquidez?.razonRapida,
                "1.0",
                "La razón rápida mide la capacidad de la empresa para cubrir sus pasivos circulantes con sus activos más líquidos, excluyendo los inventarios. Un valor satisfactorio es 1.0, pero este puede variar según el tipo de negocio. Una razón más alta indica mayor solvencia."
              )}
            </CardContent>
          </Card>

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
                "Mide la rapidez con la que el inventario se convierte en ventas. Una rotación alta indica una gestión eficiente del inventario y buenas ventas."
              )}
              {renderRatio(
                "Rotación de Cuentas por Cobrar",
                "Ventas al crédito / Cuentas por Cobrar Promedio",
                analysis?.actividad?.rotacionCxC,
                "6 - 12",
                "Indica cuántas veces al año la empresa cobra sus cuentas pendientes. Un valor alto sugiere una gestión eficiente de cobros."
              )}
              {renderRatio(
                "Periodo Promedio de Cobro",
                "360 / Rotación de Cuentas por Cobrar",
                analysis?.actividad?.periodoPromedioCobro,
                "30 - 45 días",
                "Muestra el número promedio de días que tarda la empresa en cobrar sus ventas a crédito."
              )}
              {renderRatio(
                "Rotación de Activos Fijos",
                "Ventas / Activos Fijos Promedio",
                analysis?.actividad?.rotacionActivosFijos,
                "5 - 8",
                "Mide la eficiencia con la que la empresa utiliza sus activos fijos para generar ventas."
              )}
              {renderRatio(
                "Rotación de Activos Totales",
                "Ventas / Activos Totales Promedio",
                analysis?.actividad?.rotacionActivosTotales,
                "1.0 - 2.5",
                "Indica la eficiencia general de la empresa en el uso de todos sus activos para generar ingresos."
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="bg-primary/5">
              <CardTitle className="text-2xl">3. Razones de Endeudamiento</CardTitle>
              <CardDescription>Proporción de financiamiento externo vs interno</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {renderRatio(
                "Razón de Endeudamiento",
                "Total Pasivos / Total Activos",
                analysis?.endeudamiento?.razonEndeudamiento,
                "0.3 - 0.5",
                "Mide la proporción de los activos totales que son financiados por acreedores. Un valor alto indica mayor riesgo financiero."
              )}
              {renderRatio(
                "Razón Pasivo / Capital",
                "Total Pasivos / Patrimonio Neto",
                analysis?.endeudamiento?.razonPasivoCapital,
                "0.5 - 1.0",
                "Compara la deuda total con el patrimonio de los accionistas. Indica el grado de apalancamiento financiero."
              )}
              {renderRatio(
                "Rotación de Intereses a Utilidades",
                "Utilidad Operativa / Gasto por Intereses",
                analysis?.endeudamiento?.rotacionInteresesUtilidades,
                "3 - 5",
                "Mide la capacidad de la empresa para pagar los intereses de su deuda con sus utilidades operativas."
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="bg-primary/5">
              <CardTitle className="text-2xl">4. Razones de Rentabilidad</CardTitle>
              <CardDescription>Capacidad para generar utilidades</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {renderRatio(
                "Margen de Utilidad Bruta (MUB)",
                "Utilidad Bruta / Ventas",
                analysis?.rentabilidad?.margenUtilidadBruta,
                "20% - 40%",
                "Indica el porcentaje de cada peso de ventas que queda después de pagar el costo de los bienes vendidos."
              )}
              {renderRatio(
                "Margen de Utilidad Operativa (MUO)",
                "Utilidad Operativa / Ventas",
                analysis?.rentabilidad?.margenUtilidadOperativa,
                "10% - 20%",
                "Muestra la eficiencia operativa de la empresa, excluyendo intereses e impuestos."
              )}
              {renderRatio(
                "Margen de Utilidad Neta",
                "Utilidad Neta / Ventas",
                analysis?.rentabilidad?.margenUtilidadNeta,
                "5% - 10%",
                "Representa el porcentaje de ganancia final por cada peso de ventas, después de todos los gastos e impuestos."
              )}
              {renderRatio(
                "Rentabilidad sobre el Activo (ROA)",
                "Utilidad Neta / Total Activos",
                analysis?.rentabilidad?.roa,
                "5% - 10%",
                "Mide la rentabilidad de la empresa en relación con sus activos totales."
              )}
              {renderRatio(
                "Rendimiento sobre Capital (ROE)",
                "Utilidad Neta / Capital Contable",
                analysis?.rentabilidad?.roe,
                "10% - 15%",
                "Mide la rentabilidad de la inversión de los accionistas."
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="source" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Datos Fuente Extraídos</CardTitle>
              <CardDescription>
                Visualización de los datos crudos extraídos por la IA.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/30 p-4 rounded-md font-mono text-sm overflow-auto max-h-[600px]">
                {renderSourceData(raw)}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
