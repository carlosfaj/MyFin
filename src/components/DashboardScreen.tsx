import { FinancialCard } from "./FinancialCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PieChart, 
  Activity,
  AlertCircle
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
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
  ResponsiveContainer 
} from "recharts";
import { TrafficLight } from "./TrafficLight";

const monthlyData = [
  { month: 'Ene', ingresos: 45000, gastos: 32000, utilidad: 13000 },
  { month: 'Feb', ingresos: 52000, gastos: 35000, utilidad: 17000 },
  { month: 'Mar', ingresos: 48000, gastos: 33000, utilidad: 15000 },
  { month: 'Abr', ingresos: 61000, gastos: 38000, utilidad: 23000 },
  { month: 'May', ingresos: 55000, gastos: 36000, utilidad: 19000 },
  { month: 'Jun', ingresos: 67000, gastos: 40000, utilidad: 27000 },
];

const radarData = [
  { ratio: 'Liquidez', valor: 85, optimo: 100 },
  { ratio: 'Rentabilidad', valor: 72, optimo: 100 },
  { ratio: 'Endeudamiento', valor: 45, optimo: 100 },
  { ratio: 'Actividad', valor: 90, optimo: 100 },
  { ratio: 'Solvencia', valor: 78, optimo: 100 },
];

export function DashboardScreen() {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Panel de Control</h1>
        <p className="text-muted-foreground">Resumen general de tu salud financiera</p>
      </div>

      {/* Financial Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <FinancialCard
          title="Ingresos Mensuales"
          value="$67,000"
          change={8.2}
          icon={TrendingUp}
          status="good"
        />
        <FinancialCard
          title="Gastos Operativos"
          value="$40,000"
          change={-3.5}
          icon={TrendingDown}
          status="good"
        />
        <FinancialCard
          title="Utilidad Neta"
          value="$27,000"
          change={12.1}
          icon={DollarSign}
          status="good"
        />
        <FinancialCard
          title="Margen de Utilidad"
          value="40.3%"
          change={2.4}
          icon={PieChart}
          status="good"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Tendencia de Ingresos vs Gastos</CardTitle>
            <CardDescription>Últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="ingresos" 
                  stroke="#0057B8" 
                  strokeWidth={2}
                  name="Ingresos"
                />
                <Line 
                  type="monotone" 
                  dataKey="gastos" 
                  stroke="#E74C3C" 
                  strokeWidth={2}
                  name="Gastos"
                />
                <Line 
                  type="monotone" 
                  dataKey="utilidad" 
                  stroke="#00B894" 
                  strokeWidth={2}
                  name="Utilidad"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Radar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Salud Financiera General</CardTitle>
            <CardDescription>Análisis multidimensional</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="ratio" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar 
                  name="Actual" 
                  dataKey="valor" 
                  stroke="#0057B8" 
                  fill="#0057B8" 
                  fillOpacity={0.6} 
                />
                <Radar 
                  name="Óptimo" 
                  dataKey="optimo" 
                  stroke="#00B894" 
                  fill="#00B894" 
                  fillOpacity={0.2} 
                />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Ratios Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Razón Corriente</CardTitle>
            <TrafficLight status="good" size="md" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.5</div>
            <p className="text-xs text-muted-foreground mt-1">
              Capacidad para cubrir deudas a corto plazo
            </p>
            <div className="mt-2 w-full bg-muted rounded-full h-2">
              <div className="bg-success h-2 rounded-full" style={{ width: '83%' }}></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">ROE (Rentabilidad)</CardTitle>
            <TrafficLight status="good" size="md" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18.5%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Retorno sobre el patrimonio
            </p>
            <div className="mt-2 w-full bg-muted rounded-full h-2">
              <div className="bg-success h-2 rounded-full" style={{ width: '74%' }}></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Nivel de Endeudamiento</CardTitle>
            <TrafficLight status="warning" size="md" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Proporción de deuda vs activos
            </p>
            <div className="mt-2 w-full bg-muted rounded-full h-2">
              <div className="bg-warning h-2 rounded-full" style={{ width: '45%' }}></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      <Card className="border-warning bg-warning/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-warning" />
            <CardTitle>Alertas y Recomendaciones</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-card rounded-lg">
            <Activity className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium">Rotación de inventario mejorada</p>
              <p className="text-sm text-muted-foreground">
                Tu inventario está rotando 15% más rápido este trimestre. Excelente gestión.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-card rounded-lg">
            <AlertCircle className="h-5 w-5 text-warning mt-0.5" />
            <div>
              <p className="font-medium">Nivel de endeudamiento cercano al límite</p>
              <p className="text-sm text-muted-foreground">
                Considera reducir pasivos o aumentar activos para mejorar este ratio.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
