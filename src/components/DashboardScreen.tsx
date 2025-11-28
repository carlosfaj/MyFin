import { useEffect, useState, useMemo } from "react";
import { FinancialCard } from "./FinancialCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { ScrollArea } from "./ui/scroll-area";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PieChart, 
  Activity,
  AlertCircle,
  Upload,
  ArrowRight,
  Percent
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar
} from "recharts";
import { TrafficLight } from "./TrafficLight";

interface DashboardScreenProps {
  onNavigate?: (screen: any) => void;
}

export function DashboardScreen({ onNavigate }: DashboardScreenProps) {
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);
  const [data, setData] = useState<any>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");
  const [availablePeriods, setAvailablePeriods] = useState<string[]>([]);

  useEffect(() => {
    // Cargar datos desde localStorage
    const storedData = localStorage.getItem('financialAnalysis');
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        if (parsedData && parsedData.hasData) {
          setData(parsedData);
          setHasData(true);
          
          // Extraer periodos disponibles
          const periods = Object.keys(parsedData.raw || {}).sort().reverse();
          setAvailablePeriods(periods);
          
          // Seleccionar el periodo más reciente por defecto
          if (periods.length > 0) {
            setSelectedPeriod(periods[0]);
          }
        }
      } catch (e) {
        console.error("Error parsing stored data:", e);
      }
    }
    setLoading(false);
  }, []);

  if (loading) {
    return <div className="p-8 text-center">Cargando dashboard...</div>;
  }

  if (!hasData || !data || !selectedPeriod) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] space-y-6 text-center">
        <div className="bg-muted p-6 rounded-full">
          <Upload className="h-12 w-12 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">No hay datos para mostrar</h2>
          <p className="text-muted-foreground">Importa tus primeros datos financieros para ver el análisis.</p>
        </div>
        <Button 
          size="lg" 
          onClick={() => onNavigate && onNavigate('import')}
          className="gap-2"
        >
          <Upload className="h-4 w-4" />
          Importar Datos
        </Button>
      </div>
    );
  }

  // --- PREPARACIÓN DE DATOS ---

  // 1. Datos del Periodo Seleccionado
  const currentRaw = data.raw[selectedPeriod] || {};
  const currentAnalysis = data.analysis || {}; // Nota: analysis suele ser del periodo más reciente vs anterior
  
  // Si el periodo seleccionado NO es el más reciente usado para el cálculo global, 
  // idealmente deberíamos recalcular, pero por ahora usaremos los datos crudos para visualización básica
  // y el objeto 'analysis' global para los ratios (asumiendo que el usuario quiere ver el análisis principal).
  // MEJORA: En el futuro, el backend debería devolver análisis por periodo.
  
  // Extraer valores clave de forma segura
  const getVal = (obj: any, keys: string[]) => {
    if (!obj) return 0;
    // Búsqueda simple en profundidad
    let val = 0;
    const search = (o: any) => {
      for (const k in o) {
        if (typeof o[k] === 'object' && o[k] !== null) search(o[k]);
        else if (keys.some(key => k.toLowerCase().includes(key))) val = Number(o[k]);
      }
    };
    search(obj);
    return val;
  };

  const er = currentRaw.income_statement || {};
  const bg = currentRaw.balance_sheet || {};

  const ventas = getVal(er, ['ventas', 'ingresos', 'sales']);
  const utilidadNeta = getVal(er, ['utilidad neta', 'net income']);
  const activoTotal = getVal(bg, ['total activo', 'total assets']);
  const pasivoTotal = getVal(bg, ['total pasivo', 'total liabilities']);
  const patrimonio = getVal(bg, ['patrimonio', 'equity', 'capital']);

  // 2. Datos para Gráficos de Tendencia (Todos los periodos)
  const trendData = availablePeriods.slice().reverse().map(period => {
    const pEr = data.raw[period]?.income_statement || {};
    return {
      period,
      ingresos: getVal(pEr, ['ventas', 'ingresos']),
      utilidad: getVal(pEr, ['utilidad neta', 'net income'])
    };
  });

  // 3. Datos de Análisis Horizontal (Si existe)
  const horizontalData = currentAnalysis.horizontalAnalysis || {};

  // 4. Datos de Capital Neto Operativo
  const cno = currentAnalysis.otros?.capitalNetoOperativo || 0;
  const acPercent = currentAnalysis.otros?.acPercent || 0;
  const pcPercent = currentAnalysis.otros?.pcPercent || 0;

  // 5. Ratios (Del análisis global)
  const liquidez = currentAnalysis.liquidez || {};
  const rentabilidad = currentAnalysis.rentabilidad || {};
  const endeudamiento = currentAnalysis.endeudamiento || {};
  const actividad = currentAnalysis.actividad || {};

  const radarData = [
    { ratio: 'Liquidez', valor: Math.min((liquidez.razonCirculante?.valor || 0) * 50, 100), fullMark: 100 },
    { ratio: 'Rentabilidad', valor: Math.min((rentabilidad.roe?.valor || 0) * 2, 100), fullMark: 100 },
    { ratio: 'Endeudamiento', valor: Math.min(100 - (endeudamiento.razonEndeudamiento?.valor || 0) * 100, 100), fullMark: 100 },
    { ratio: 'Actividad', valor: Math.min((actividad.rotacionActivosTotales?.valor || 0) * 50, 100), fullMark: 100 },
  ];

  // TODO: Implementar Origen y Aplicación en el backend
  // const sourcesAndUses = { sources: [], applications: [] };

  // 6. Origen y Aplicación (Del backend)
  const origenAplicacion = currentAnalysis.otros?.origenAplicacion || { sources: [], applications: [] };

  // 7. Estado de Flujo de Efectivo (Del backend)
  const cashFlow = currentAnalysis.otros?.cashFlowStatement || {
    operating: [],
    investing: [],
    financing: [],
    operatingTotal: 0,
    investingTotal: 0,
    financingTotal: 0,
    netCashFlow: 0
  };

  // Helper para truncar nombres largos
  const truncateName = (name: string, maxLength: number = 50): string => {
    if (name.length <= maxLength) return name;
    return name.substring(0, maxLength - 3) + '...';
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Panel de Control</h1>
          <p className="text-muted-foreground">Visión general de tu desempeño financiero</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Periodo:</span>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Seleccionar año" />
            </SelectTrigger>
            <SelectContent>
              {availablePeriods.map(p => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <FinancialCard
          title="Ingresos Totales"
          value={`$${ventas.toLocaleString()}`}
          change={0} 
          icon={TrendingUp}
          status="good"
        />
        <FinancialCard
          title="Utilidad Neta"
          value={`$${utilidadNeta.toLocaleString()}`}
          change={0}
          icon={DollarSign}
          status={utilidadNeta >= 0 ? "good" : "danger"}
        />
        <FinancialCard
          title="Activos Totales"
          value={`$${activoTotal.toLocaleString()}`}
          change={0}
          icon={Activity}
          status="good"
        />
        <FinancialCard
          title="ROE"
          value={`${(rentabilidad.roe?.valor || 0).toFixed(1)}%`}
          change={0}
          icon={PieChart}
          status={(rentabilidad.roe?.valor || 0) > 10 ? "good" : "warning"}
        />
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="ratios">Razones Financieras</TabsTrigger>
          <TabsTrigger value="horizontal">Análisis Horizontal</TabsTrigger>
          <TabsTrigger value="cno">Capital Neto Operativo</TabsTrigger>
          <TabsTrigger value="eoa">Origen y Aplicación</TabsTrigger>
          <TabsTrigger value="cashflow">Flujo de Efectivo</TabsTrigger>
        </TabsList>

        {/* TAB: OVERVIEW */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Tendencia de Ingresos y Utilidad</CardTitle>
                <CardDescription>Evolución histórica</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="ingresos" stroke="#0057B8" strokeWidth={2} name="Ingresos" />
                    <Line type="monotone" dataKey="utilidad" stroke="#00B894" strokeWidth={2} name="Utilidad Neta" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Radar Financiero</CardTitle>
                <CardDescription>Fortalezas y debilidades relativas</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="ratio" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar name="Puntaje" dataKey="valor" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB: RATIOS */}
        <TabsContent value="ratios" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Liquidez */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-500" /> Liquidez
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <RatioRow label="Razón Circulante" value={liquidez.razonCirculante?.valor} optimo="1.5 - 2.0" />
                <RatioRow label="Prueba Ácida" value={liquidez.razonRapida?.valor} optimo="> 1.0" />
                <RatioRow label="Cap. Trabajo" value={liquidez.capitalNetoTrabajo?.valor} isCurrency />
              </CardContent>
            </Card>

            {/* Rentabilidad */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-500" /> Rentabilidad
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <RatioRow label="Margen Bruto" value={rentabilidad.margenUtilidadBruta?.valor} isPercent />
                <RatioRow label="Margen Neto" value={rentabilidad.margenUtilidadNeta?.valor} isPercent />
                <RatioRow label="ROE" value={rentabilidad.roe?.valor} isPercent />
                <RatioRow label="ROA" value={rentabilidad.roa?.valor} isPercent />
              </CardContent>
            </Card>

            {/* Endeudamiento */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-red-500" /> Endeudamiento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <RatioRow label="Nivel Endeudamiento" value={endeudamiento.razonEndeudamiento?.valor} isPercent />
                <RatioRow label="Pasivo / Capital" value={endeudamiento.razonPasivoCapital?.valor} />
              </CardContent>
            </Card>

            {/* Actividad */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-orange-500" /> Actividad
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <RatioRow label="Rot. Inventario" value={actividad.rotacionInventario?.valor} />
                <RatioRow label="Rot. Activos" value={actividad.rotacionActivosTotales?.valor} />
                <RatioRow label="Periodo Cobro" value={actividad.periodoPromedioCobro?.valor} suffix=" días" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB: HORIZONTAL */}
        <TabsContent value="horizontal">
          <Card>
            <CardHeader>
              <CardTitle>Análisis Horizontal (Variaciones)</CardTitle>
              <CardDescription>Comparativo con el periodo anterior</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cuenta</TableHead>
                      <TableHead className="text-right">Valor Actual</TableHead>
                      <TableHead className="text-right">Var. Absoluta ($)</TableHead>
                      <TableHead className="text-right">Var. Relativa (%)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {renderHorizontalRows(horizontalData.balance_sheet)}
                    {renderHorizontalRows(horizontalData.income_statement)}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: CNO */}
        <TabsContent value="cno">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <Card>
               <CardHeader>
                 <CardTitle>Capital Neto Operativo (CNO)</CardTitle>
                 <CardDescription>Medida de la inversión neta en operaciones</CardDescription>
               </CardHeader>
               <CardContent className="flex flex-col items-center justify-center py-8">
                 <div className="text-5xl font-bold text-primary mb-2">
                   {cno.toFixed(2)}%
                 </div>
                 <p className="text-muted-foreground text-center max-w-xs">
                   El CNO indica qué porcentaje de tus recursos está comprometido en la operación diaria.
                 </p>
               </CardContent>
             </Card>

             <Card>
               <CardHeader>
                 <CardTitle>Composición CNO</CardTitle>
                 <CardDescription>Activos vs Pasivos Operativos (%)</CardDescription>
               </CardHeader>
               <CardContent>
                 <ResponsiveContainer width="100%" height={250}>
                   <BarChart data={[
                     { name: 'AC%', valor: acPercent, fill: '#00B894' },
                     { name: 'PC%', valor: pcPercent, fill: '#E74C3C' },
                   ]}>
                     <CartesianGrid strokeDasharray="3 3" />
                     <XAxis dataKey="name" />
                     <YAxis />
                     <Tooltip />
                     <Bar dataKey="valor" fill="#8884d8" label={{ position: 'top' }} />
                   </BarChart>
                 </ResponsiveContainer>
               </CardContent>
             </Card>
           </div>
        </TabsContent>

        {/* TAB: ORIGEN Y APLICACIÓN */}
        <TabsContent value="eoa">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-green-600 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Orígenes
                </CardTitle>
                <CardDescription>Fuentes de recursos financieros</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Concepto</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {origenAplicacion.sources && origenAplicacion.sources.length > 0 ? (
                        origenAplicacion.sources.map((item: any, i: number) => (
                          <TableRow key={i}>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell className="text-right font-mono">${(item.value || 0).toLocaleString()}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={2} className="text-center text-muted-foreground py-8">
                            No hay orígenes para mostrar
                          </TableCell>
                        </TableRow>
                      )}
                      <TableRow className="font-bold bg-muted/50 border-t-2">
                        <TableCell>TOTAL ORÍGENES</TableCell>
                        <TableCell className="text-right font-mono">
                          ${(origenAplicacion.sources?.reduce((sum: number, item: any) => sum + (item.value || 0), 0) || 0).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-red-600 flex items-center gap-2">
                  <TrendingDown className="h-5 w-5" />
                  Aplicaciones
                </CardTitle>
                <CardDescription>Usos de recursos financieros</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Concepto</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {origenAplicacion.applications && origenAplicacion.applications.length > 0 ? (
                        origenAplicacion.applications.map((item: any, i: number) => (
                          <TableRow key={i}>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell className="text-right font-mono">${(item.value || 0).toLocaleString()}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={2} className="text-center text-muted-foreground py-8">
                            No hay aplicaciones para mostrar
                          </TableCell>
                        </TableRow>
                      )}
                      <TableRow className="font-bold bg-muted/50 border-t-2">
                        <TableCell>TOTAL APLICACIONES</TableCell>
                        <TableCell className="text-right font-mono">
                          ${(origenAplicacion.applications?.reduce((sum: number, item: any) => sum + (item.value || 0), 0) || 0).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB: FLUJO DE EFECTIVO */}
        <TabsContent value="cashflow">
          <div className="space-y-6">
            {/* Summary Card */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
              <CardHeader>
                <CardTitle className="text-2xl">Estado de Flujo de Efectivo</CardTitle>
                <CardDescription>Método Indirecto - Cambios entre periodos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
                    <p className="text-sm text-muted-foreground">Actividades Operativas</p>
                    <p className={`text-2xl font-bold ${cashFlow.operatingTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${cashFlow.operatingTotal.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
                    <p className="text-sm text-muted-foreground">Actividades de Inversión</p>
                    <p className={`text-2xl font-bold ${cashFlow.investingTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${cashFlow.investingTotal.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
                    <p className="text-sm text-muted-foreground">Actividades de Financiación</p>
                    <p className={`text-2xl font-bold ${cashFlow.financingTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${cashFlow.financingTotal.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg">
                    <p className="text-sm opacity-90">Flujo Neto de Efectivo</p>
                    <p className="text-2xl font-bold">
                      ${cashFlow.netCashFlow.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Activity Details */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Operating Activities */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-green-600 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Actividades Operativas
                  </CardTitle>
                  <CardDescription>Flujo de efectivo de operaciones</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Concepto</TableHead>
                          <TableHead className="text-right">Monto</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cashFlow.operating && cashFlow.operating.length > 0 ? (
                          cashFlow.operating.map((item: any, i: number) => (
                            <TableRow key={i}>
                              <TableCell className="font-medium">{truncateName(item.name)}</TableCell>
                              <TableCell className={`text-right font-mono ${item.value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                ${item.value.toLocaleString()}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={2} className="text-center text-muted-foreground py-8">
                              No hay actividades operativas
                            </TableCell>
                          </TableRow>
                        )}
                        <TableRow className="font-bold bg-green-50 dark:bg-green-950 border-t-2">
                          <TableCell>TOTAL OPERATIVO</TableCell>
                          <TableCell className={`text-right font-mono ${cashFlow.operatingTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ${cashFlow.operatingTotal.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Investing Activities */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-blue-600 flex items-center gap-2">
                    <TrendingDown className="h-5 w-5" />
                    Actividades de Inversión
                  </CardTitle>
                  <CardDescription>Compra/venta de activos</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Concepto</TableHead>
                          <TableHead className="text-right">Monto</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cashFlow.investing && cashFlow.investing.length > 0 ? (
                          cashFlow.investing.map((item: any, i: number) => (
                            <TableRow key={i}>
                              <TableCell className="font-medium">{truncateName(item.name)}</TableCell>
                              <TableCell className={`text-right font-mono ${item.value  >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                ${item.value.toLocaleString()}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={2} className="text-center text-muted-foreground py-8">
                              No hay actividades de inversión
                            </TableCell>
                          </TableRow>
                        )}
                        <TableRow className="font-bold bg-blue-50 dark:bg-blue-950 border-t-2">
                          <TableCell>TOTAL INVERSIÓN</TableCell>
                          <TableCell className={`text-right font-mono ${cashFlow.investingTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ${cashFlow.investingTotal.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Financing Activities */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-purple-600 flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Actividades de Financiación
                  </CardTitle>
                  <CardDescription>Deuda, capital y dividendos</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Concepto</TableHead>
                          <TableHead className="text-right">Monto</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cashFlow.financing && cashFlow.financing.length > 0 ? (
                          cashFlow.financing.map((item: any, i: number) => (
                            <TableRow key={i}>
                              <TableCell className="font-medium">{truncateName(item.name)}</TableCell>
                              <TableCell className={`text-right font-mono ${item.value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                ${item.value.toLocaleString()}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={2} className="text-center text-muted-foreground py-8">
                              No hay actividades de financiación
                            </TableCell>
                          </TableRow>
                        )}
                        <TableRow className="font-bold bg-purple-50 dark:bg-purple-950 border-t-2">
                          <TableCell>TOTAL FINANCIACIÓN</TableCell>
                          <TableCell className={`text-right font-mono ${cashFlow.financingTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ${cashFlow.financingTotal.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

      </Tabs>
    </div>
  );
}

// --- SUB-COMPONENTES ---

function RatioRow({ label, value, optimo, isPercent, isCurrency, suffix = '' }: any) {
  if (value === undefined || value === null) return null;
  
  let displayValue = value.toFixed(2);
  if (isPercent) displayValue += '%';
  if (isCurrency) displayValue = `$${Number(value).toLocaleString()}`;
  
  return (
    <div className="flex items-center justify-between border-b pb-2 last:border-0">
      <div>
        <p className="font-medium text-sm">{label}</p>
        {optimo && <p className="text-xs text-muted-foreground">Meta: {optimo}</p>}
      </div>
      <div className="text-right">
        <p className="font-bold">{displayValue}{suffix}</p>
      </div>
    </div>
  );
}

function renderHorizontalRows(data: any) {
  if (!data) return null;
  
  // Aplanar y filtrar solo cuentas con variación significativa
  const rows: any[] = [];
  const traverse = (obj: any, prefix = '') => {
    for (const key in obj) {
      if (key === 'value' || key === 'abs' || key === 'rel') continue;
      
      if (obj[key].abs !== undefined) {
        rows.push({ name: prefix + key, ...obj[key] });
      } else if (typeof obj[key] === 'object') {
        traverse(obj[key], prefix); // No prefix for cleaner look, or use prefix + key + ' > '
      }
    }
  };
  traverse(data);

  // Ordenar por variación absoluta descendente
  rows.sort((a, b) => Math.abs(b.abs) - Math.abs(a.abs));

  return rows.map((row, i) => (
    <TableRow key={i}>
      <TableCell className="font-medium">{row.name}</TableCell>
      <TableCell className="text-right">${row.value?.toLocaleString()}</TableCell>
      <TableCell className={`text-right ${row.abs >= 0 ? 'text-green-600' : 'text-red-600'}`}>
        {row.abs >= 0 ? '+' : ''}{row.abs.toLocaleString()}
      </TableCell>
      <TableCell className={`text-right ${row.rel >= 0 ? 'text-green-600' : 'text-red-600'}`}>
        {row.rel.toFixed(2)}%
      </TableCell>
    </TableRow>
  ));
}
