import { useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Terminal, FileSearch } from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";
import * as XLSX from "xlsx";

interface DataImportScreenProps {
  onNavigate: (screen: any) => void;
}

export function DataImportScreen({ onNavigate }: DataImportScreenProps) {
  const [importing, setImporting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const [scanResult, setScanResult] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const addLog = (msg: string, data?: any) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${msg} ${data ? JSON.stringify(data, null, 2) : ''}`;
    console.log(msg, data);
    setDebugLog(prev => [...prev, logEntry]);
  };

  const detectSheetType = (rows: any[][]): "balance_sheet" | "income_statement" | null => {
    const textContent = rows.slice(0, 20).map(row => row.join(' ').toLowerCase()).join(' ');
    
    // Palabras clave para Balance General
    const balanceKeywords = ['activo', 'pasivo', 'patrimonio', 'capital', 'balance', 'assets', 'liabilities', 'equity'];
    // Palabras clave para Estado de Resultados
    const incomeKeywords = ['ventas', 'ingresos', 'costo', 'gastos', 'utilidad', 'resultado', 'income', 'revenue', 'profit', 'sales'];

    let balanceScore = 0;
    let incomeScore = 0;

    balanceKeywords.forEach(k => { if (textContent.includes(k)) balanceScore++; });
    incomeKeywords.forEach(k => { if (textContent.includes(k)) incomeScore++; });

    if (balanceScore > incomeScore) return "balance_sheet";
    if (incomeScore > balanceScore) return "income_statement";
    
    return null;
  };

  const handleFileUpload = () => {
    setError(null);
    setSuccess(false);
    setDebugLog([]);
    setScanResult([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    setImporting(true);
    addLog(`Iniciando análisis de archivo: ${file.name}`);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });

      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        throw new Error("El archivo está vacío.");
      }

      const rawSheets: any[] = [];
      const detectedSheets: string[] = [];

      // Iterar sobre todas las hojas
      for (const sheetName of workbook.SheetNames) {
        const ws = workbook.Sheets[sheetName];
        const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
        
        if (rows.length < 2) continue;

        const type = detectSheetType(rows);
        if (type) {
          addLog(`Hoja "${sheetName}" detectada como: ${type}`);
          detectedSheets.push(`${sheetName} (${type === 'balance_sheet' ? 'Balance' : 'Resultados'})`);
          
          // En lugar de extraer aquí, enviamos las filas crudas al backend
          rawSheets.push({
            type,
            rows: rows // Enviamos todas las filas tal cual
          });
        } else {
          addLog(`Hoja "${sheetName}" ignorada (no se detectó contenido financiero claro).`);
        }
      }

      setScanResult(detectedSheets);

      if (rawSheets.length === 0) {
        throw new Error("No se encontraron hojas financieras válidas.");
      }

      addLog(`Enviando ${rawSheets.length} hojas crudas al servidor para análisis IA...`);

      const res = await fetch('http://localhost:4000/api/financial-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'user_demo',
          rawSheets: rawSheets // Nuevo payload
        })
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error("Error del servidor: " + text);
      }
      
      const json = await res.json();
      addLog('Respuesta exitosa del servidor.', json);

      if (json.success) {
        localStorage.setItem('financialAnalysis', JSON.stringify(json));
        setSuccess(true);
        alert(`¡Importación Exitosa!\n\nSe procesaron: \n${detectedSheets.join('\n')}`);
        onNavigate('analysis');
      } else {
        throw new Error(json.error || "Error desconocido en la respuesta.");
      }

    } catch (err: any) {
      console.error(err);
      addLog("ERROR CRÍTICO:", err.message);
      setError(err.message || "Error al procesar el archivo");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={handleFileChange}
      />
      
      <div>
        <h1 className="text-3xl font-bold">Importación Automática (AI Powered)</h1>
        <p className="text-muted-foreground">
          El sistema detectará, clasificará y extraerá automáticamente tus estados financieros usando IA.
        </p>
      </div>

      {success && (
        <Alert className="bg-success/10 border-success">
          <CheckCircle2 className="h-4 w-4 text-success" />
          <AlertDescription className="text-success">
            ¡Datos procesados correctamente! Redirigiendo...
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert className="bg-destructive/10 border-destructive">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <AlertDescription className="text-destructive font-semibold">
            {error}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="hover:shadow-lg transition-all cursor-pointer hover:scale-[1.02] border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-full">
                <FileSearch className="h-8 w-8 text-primary" />
              </div>
              <div>
                <CardTitle>Importar Archivo Excel</CardTitle>
                <CardDescription>Soporta múltiples hojas (Balance y Resultados)</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full h-12 text-lg" 
              onClick={handleFileUpload}
              disabled={importing}
            >
              {importing ? "Analizando con IA..." : "Seleccionar Archivo"}
            </Button>
            <p className="text-xs text-center mt-3 text-muted-foreground">
              Formatos: .xlsx, .xls
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Estado del Análisis</CardTitle>
          </CardHeader>
          <CardContent>
            {scanResult.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm font-medium text-success">Hojas Detectadas:</p>
                <ul className="list-disc list-inside text-sm text-muted-foreground">
                  {scanResult.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-24 text-muted-foreground text-sm opacity-60">
                <FileSpreadsheet className="h-8 w-8 mb-2" />
                Esperando archivo...
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Debug Console */}
      <Card className="border-dashed border-muted-foreground/30 bg-muted/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Terminal className="h-3 w-3" />
            Log de Procesamiento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-black/90 text-green-400 p-4 rounded-md font-mono text-xs h-64 overflow-y-auto whitespace-pre-wrap shadow-inner">
            {debugLog.length === 0 ? (
              <span className="text-gray-600 italic">Listo para iniciar...</span>
            ) : (
              debugLog.map((log, i) => (
                <div key={i} className="mb-1 border-b border-green-900/20 pb-0.5 last:border-0">
                  {log}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}