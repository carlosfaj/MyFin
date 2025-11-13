import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "./ui/table";
import { Badge } from "./ui/badge";
import { TrafficLight } from "./TrafficLight";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell
} from "recharts";

const incomeStatementData = [
  { concepto: 'Ingresos por Ventas', actual: 450000, anterior: 420000, varPct: 7.1 },
  { concepto: 'Costo de Ventas', actual: -180000, anterior: -170000, varPct: 5.9 },
  { concepto: 'Utilidad Bruta', actual: 270000, anterior: 250000, varPct: 8.0 },
  { concepto: 'Gastos Operativos', actual: -120000, anterior: -115000, varPct: 4.3 },
  { concepto: 'Utilidad Operativa', actual: 150000, anterior: 135000, varPct: 11.1 },
  { concepto: 'Gastos Financieros', actual: -15000, anterior: -12000, varPct: 25.0 },
  { concepto: 'Utilidad Antes de Impuestos', actual: 135000, anterior: 123000, varPct: 9.8 },
  { concepto: 'Impuestos', actual: -40500, anterior: -36900, varPct: 9.8 },
  { concepto: 'Utilidad Neta', actual: 94500, anterior: 86100, varPct: 9.8 },
];

const balanceSheetData = [
  { concepto: 'Efectivo y Equivalentes', actual: 125000, total: 28 },
  { concepto: 'Cuentas por Cobrar', actual: 95000, total: 21 },
  { concepto: 'Inventarios', actual: 85000, total: 19 },
  { concepto: 'Activos Fijos', actual: 145000, total: 32 },
  { concepto: 'Total Activos', actual: 450000, total: 100 },
];

const ratiosData = [
  { nombre: 'Razón Corriente', valor: 2.5, optimo: '2.0 - 3.0', status: 'good' as const, categoria: 'Liquidez' },
  { nombre: 'Prueba Ácida', valor: 1.8, optimo: '1.0 - 2.0', status: 'good' as const, categoria: 'Liquidez' },
  { nombre: 'ROE', valor: 18.5, optimo: '> 15%', status: 'good' as const, categoria: 'Rentabilidad' },
  { nombre: 'ROA', valor: 12.3, optimo: '> 10%', status: 'good' as const, categoria: 'Rentabilidad' },
  { nombre: 'Margen Neto', valor: 21.0, optimo: '> 15%', status: 'good' as const, categoria: 'Rentabilidad' },
  { nombre: 'Endeudamiento', valor: 45, optimo: '< 50%', status: 'warning' as const, categoria: 'Endeudamiento' },
  { nombre: 'Cobertura de Intereses', valor: 10, optimo: '> 5', status: 'good' as const, categoria: 'Endeudamiento' },
  { nombre: 'Rotación de Activos', valor: 1.5, optimo: '> 1.0', status: 'good' as const, categoria: 'Actividad' },
  { nombre: 'Rotación de Inventario', valor: 6.2, optimo: '> 4', status: 'good' as const, categoria: 'Actividad' },
];

const verticalAnalysisChart = [
  { name: 'Activo Corriente', value: 68, color: '#0057B8' },
  { name: 'Activo No Corriente', value: 32, color: '#00B894' },
];

export function AnalysisScreen() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Análisis Detallado</h1>
        <p className="text-muted-foreground">Estados financieros y razones completas</p>
      </div>

      <Tabs defaultValue="income" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
          <TabsTrigger value="income">Estado de Resultados</TabsTrigger>
          <TabsTrigger value="balance">Balance General</TabsTrigger>
          <TabsTrigger value="ratios">Razones Financieras</TabsTrigger>
        </TabsList>

        {/* Income Statement Tab */}
        <TabsContent value="income" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Estado de Resultados - Análisis Horizontal</CardTitle>
              <CardDescription>Comparación año actual vs año anterior</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Concepto</TableHead>
                      <TableHead className="text-right">Año Actual</TableHead>
                      <TableHead className="text-right">Año Anterior</TableHead>
                      <TableHead className="text-right">Variación %</TableHead>
                      <TableHead className="text-right">Tendencia</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {incomeStatementData.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{item.concepto}</TableCell>
                        <TableCell className="text-right">
                          ${Math.abs(item.actual).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          ${Math.abs(item.anterior).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant={item.varPct > 0 ? "default" : "secondary"}>
                            {item.varPct > 0 ? '+' : ''}{item.varPct.toFixed(1)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {item.varPct > 5 ? '📈' : item.varPct < -5 ? '📉' : '➡️'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Balance Sheet Tab */}
        <TabsContent value="balance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Balance General - Análisis Vertical</CardTitle>
                <CardDescription>Composición de activos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Concepto</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead className="text-right">% del Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {balanceSheetData.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{item.concepto}</TableCell>
                          <TableCell className="text-right">
                            ${item.actual.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <span>{item.total}%</span>
                              <div className="w-16 bg-muted rounded-full h-2">
                                <div 
                                  className="bg-primary h-2 rounded-full" 
                                  style={{ width: `${item.total}%` }}
                                />
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribución de Activos</CardTitle>
                <CardDescription>Visualización de composición</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={verticalAnalysisChart}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" name="Porcentaje">
                      {verticalAnalysisChart.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Financial Ratios Tab */}
        <TabsContent value="ratios" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {['Liquidez', 'Rentabilidad', 'Endeudamiento', 'Actividad'].map(categoria => (
              <Card key={categoria}>
                <CardHeader>
                  <CardTitle>Razones de {categoria}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Indicador</TableHead>
                          <TableHead className="text-right">Valor</TableHead>
                          <TableHead>Rango Óptimo</TableHead>
                          <TableHead className="text-right">Estado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ratiosData
                          .filter(r => r.categoria === categoria)
                          .map((ratio, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="font-medium">{ratio.nombre}</TableCell>
                              <TableCell className="text-right text-lg font-semibold">
                                {typeof ratio.valor === 'number' 
                                  ? ratio.nombre.includes('%') || ratio.nombre.includes('Margen')
                                    ? `${ratio.valor}%`
                                    : ratio.valor.toFixed(1)
                                  : ratio.valor
                                }
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{ratio.optimo}</Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <TrafficLight status={ratio.status} size="md" showLabel />
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
