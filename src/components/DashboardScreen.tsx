import { useEffect, useState } from "react";
import { FinancialCard } from "./FinancialCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PieChart, 
  Activity,
  AlertCircle,
  Upload
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
  ResponsiveContainer 
} from "recharts";
import { TrafficLight } from "./TrafficLight";

interface DashboardScreenProps {
  onNavigate?: (screen: any) => void;
}

export function DashboardScreen({ onNavigate }: DashboardScreenProps) {
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch('http://localhost:4000/api/financial-analysis?userId=user_demo')
      .then(res => res.json())
      .then(data => {
        if (data && data.hasData) {
          setHasData(true);
          setData(data);
        } else {
          setHasData(false);
        }
      })
      .catch(err => {
        console.error("Error fetching dashboard data:", err);
        setHasData(false);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-8 text-center">Cargando dashboard...</div>;
  }

  if (!hasData || !data || !data.analysis) {
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

  // Preparar datos para gráficos de forma segura
  const { analysis, currentPeriod, raw } = data;
  const periods = Object.keys(raw || {}).sort(); 
  
  const trendData = periods.map(period => {
    const er = raw[period]?.income_statement || {};
    
    // Función simple para buscar valor en objeto anidado
    const findVal = (obj: any, keys: string[]): number => {
      if (!obj) return 0;
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

    const ingresos = findVal(er, ['ventas', 'ingresos', 'sales']);
    const gastos = findVal(er, ['gastos operativos', 'total gastos', 'gastosoperativos']); 
    const utilidad = findVal(er, ['utilidad neta', 'net income', 'utilidadneta']);

    return {
      period,
      ingresos,
      gastos,
      utilidad
    };
  });

  // Valores seguros para Radar y Cards
  const razonCorriente = analysis.liquidez?.razonCorriente?.valor || 0;
  const roe = analysis.rentabilidad?.roe?.valor || 0;
  const nivelEndeudamiento = analysis.endeudamiento?.nivelEndeudamiento?.valor || 0;
  const rotacionActivos = analysis.actividad?.rotacionActivos?.valor || 0;
  const margenNeto = analysis.rentabilidad?.margenNeto?.valor || 0;

  const radarData = [
    { ratio: 'Liquidez', valor: Math.min(razonCorriente * 50, 100), optimo: 80 },
    { ratio: 'Rentabilidad', valor: Math.min(roe * 2, 100), optimo: 60 },
    { ratio: 'Endeudamiento', valor: Math.min(100 - nivelEndeudamiento, 100), optimo: 50 },
    { ratio: 'Actividad', valor: Math.min(rotacionActivos * 50, 100), optimo: 70 },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Panel de Control</h1>
        <p className="text-muted-foreground">Resumen general de tu salud financiera ({currentPeriod})</p>
      </div>

      {/* Financial Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <FinancialCard
          title="Ingresos Totales"
          value={`$${analysis.raw?.ventas?.toLocaleString() || '0'}`}
          change={0} 
          icon={TrendingUp}
          status="good"
        />
        <FinancialCard
          title="Utilidad Neta"
          value={`$${analysis.raw?.utilidadNeta?.toLocaleString() || '0'}`}
          change={0}
          icon={DollarSign}
          status={(analysis.raw?.utilidadNeta || 0) >= 0 ? "good" : "danger"}
        />
        <FinancialCard
          title="Activos Totales"
          value={`$${analysis.raw?.activoTotal?.toLocaleString() || '0'}`}
          change={0}
          icon={Activity}
          status="good"
        />
        <FinancialCard
          title="Margen Neto"
          value={`${margenNeto.toFixed(1)}%`}
          change={0}
          icon={PieChart}
          status={margenNeto > 10 ? "good" : "warning"}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Tendencia Histórica</CardTitle>
            <CardDescription>Ingresos vs Gastos vs Utilidad</CardDescription>
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
                <Line type="monotone" dataKey="gastos" stroke="#E74C3C" strokeWidth={2} name="Gastos" />
                <Line type="monotone" dataKey="utilidad" stroke="#00B894" strokeWidth={2} name="Utilidad" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Radar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Salud Financiera General</CardTitle>
            <CardDescription>Puntaje relativo (0-100)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="ratio" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar name="Actual" dataKey="valor" stroke="#0057B8" fill="#0057B8" fillOpacity={0.6} />
                <Radar name="Óptimo" dataKey="optimo" stroke="#00B894" fill="#00B894" fillOpacity={0.2} />
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
            <TrafficLight status={razonCorriente > 1.5 ? "good" : "warning"} size="md" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{razonCorriente.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Capacidad pago corto plazo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">ROE</CardTitle>
            <TrafficLight status={roe > 15 ? "good" : "warning"} size="md" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roe.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">Retorno sobre patrimonio</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Endeudamiento</CardTitle>
            <TrafficLight status={nivelEndeudamiento < 50 ? "good" : "warning"} size="md" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{nivelEndeudamiento.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">Nivel de deuda total</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
