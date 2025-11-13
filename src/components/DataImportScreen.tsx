import { useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";
import * as XLSX from "xlsx";

export function DataImportScreen() {
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [previewData, setPreviewData] = useState<any[][]>([]);
  const [error, setError] = useState<string | null>(null);
  const [accept, setAccept] = useState<string>(".xlsx,.xls");
  const [sheets, setSheets] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string | null>(null);
  const workbookRef = useRef<XLSX.WorkBook | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const handleFileUpload = () => {
    setAccept(".xlsx,.xls");

    setError(null);
    setPreviewData([]);
    setSuccess(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    setImporting(true);
    setUploadedFile(file.name);

    try {
      const arrayBuffer = await file.arrayBuffer();

      const workbook = XLSX.read(arrayBuffer, { type: "array" });

      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        throw new Error("No se encontraron hojas en el archivo.");
      }

      workbookRef.current = workbook;
      setSheets(workbook.SheetNames);

      const firstSheet = workbook.SheetNames[0];
      setSelectedSheet(firstSheet);
      const worksheet = workbook.Sheets[firstSheet];
      const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
      setPreviewData(rows);
      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Error al procesar el archivo");
      setSuccess(false);
    } finally {
      setImporting(false);
    }
  };

  const handleSheetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sheetName = e.target.value;
    setSelectedSheet(sheetName);
    setError(null);
    setSuccess(false);

    const wb = workbookRef.current;
    if (!wb) return;

    try {
      const ws = wb.Sheets[sheetName];
      if (!ws) throw new Error("Hoja no encontrada en el workbook.");
      const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
      setPreviewData(rows);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Error al cambiar de hoja");
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Hidden file input used to pick files */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleFileChange}
      />
      <div>
        <h1 className="text-3xl font-bold">Importar Datos Financieros</h1>
        <p className="text-muted-foreground">
          Sube tus archivos de estados financieros para análisis automático
        </p>
      </div>

      {success && (
        <Alert className="bg-success/10 border-success">
          <CheckCircle2 className="h-4 w-4 text-success" />
          <AlertDescription className="text-success">
            ¡Archivo importado exitosamente! Los datos están siendo procesados.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-lg transition-all cursor-pointer hover:scale-105">
          <CardHeader>
            <div className="flex items-center justify-between">
              <FileSpreadsheet className="h-8 w-8 text-success" />
              <span className="text-xs bg-success/10 text-success px-2 py-1 rounded">
                Recomendado
              </span>
            </div>
            <CardTitle className="text-lg">Excel (.xlsx)</CardTitle>
            <CardDescription>Archivos de Microsoft Excel</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full rounded-lg" 
              onClick={handleFileUpload}
              disabled={importing}
            >
              <Upload className="mr-2 h-4 w-4" />
              Subir XLSX
            </Button>
          </CardContent>
        </Card>
<<<<<<< HEAD
=======

        <Card className="hover:shadow-lg transition-all cursor-pointer hover:scale-105">
          <CardHeader>
            <FileText className="h-8 w-8 text-primary" />
            <CardTitle className="text-lg">CSV (.csv)</CardTitle>
            <CardDescription>Valores separados por coma</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full rounded-lg" 
              variant="outline"
              onClick={() => handleFileUpload('csv')}
              disabled={importing}
            >
              <Upload className="mr-2 h-4 w-4" />
              Subir CSV
            </Button>
          </CardContent>
        </Card>        
>>>>>>> f09bad98dcca16eadb92516d30f69250c226cd41
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Instrucciones de Importación</CardTitle>
          <CardDescription>Sigue estos pasos para una importación exitosa</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <span className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">1</span>
                Formato del Archivo
              </h3>
              <p className="text-sm text-muted-foreground ml-8">
                Asegúrate de que tu archivo contenga columnas para: Concepto, Año Actual, Año Anterior. 
                Los nombres pueden variar pero deben ser identificables.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <span className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">2</span>
                Datos Requeridos
              </h3>
              <p className="text-sm text-muted-foreground ml-8">
                Incluye al menos: Balance General (Activos, Pasivos, Patrimonio) y Estado de Resultados 
                (Ingresos, Costos, Gastos).
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <span className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">3</span>
                Validación
              </h3>
              <p className="text-sm text-muted-foreground ml-8">
                El sistema validará automáticamente que los totales cuadren y que no haya datos faltantes. 
                Recibirás un reporte de validación.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <span className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">4</span>
                Análisis Automático
              </h3>
              <p className="text-sm text-muted-foreground ml-8">
                Una vez importado, el sistema calculará automáticamente todas las razones financieras 
                y generará visualizaciones.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-primary/5 to-success/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-primary" />
            <CardTitle>Plantilla de Ejemplo</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            ¿Primera vez importando datos? Descarga nuestra plantilla pre-formateada 
            para facilitar el proceso.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" className="rounded-lg">
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Descargar Plantilla Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      {uploadedFile && (
        <Card className="border-primary h-[70vh]">
          <CardHeader>
            <CardTitle>Vista Previa de Datos Importados</CardTitle>
            <CardDescription>Archivo: {uploadedFile}</CardDescription>
          </CardHeader>
          <CardContent className="h-full flex flex-col">
            <div className="space-y-4 text-sm flex-1 flex flex-col">
              {sheets && sheets.length > 1 && (
                <div className="flex items-center gap-3">
                  <label className="text-sm">Hoja:</label>
                      <select
                        value={selectedSheet ?? ""}
                        onChange={handleSheetChange}
                        className="border rounded px-2 py-1 text-sm"
                      >
                        {sheets.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                </div>
              )}
              <div className="flex justify-between p-2 bg-muted rounded">
                <span>Total de filas:</span>
                <span className="font-semibold">{previewData.length}</span>
              </div>

              <div className="overflow-auto border rounded flex-1">
                {previewData && previewData.length > 0 ? (
                  <table className="min-w-max text-sm table-auto border-collapse w-full">
                    <thead>
                      <tr>
                        {previewData[0].map((col: any, idx: number) => (
                          <th key={idx} className="border p-2 text-left bg-muted break-words whitespace-normal">{col || `Col ${idx+1}`}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((row, rIdx) => (
                        <tr key={rIdx} className={rIdx % 2 === 0 ? "bg-white" : "bg-muted"}>
                          {row.map((cell: any, cIdx: number) => (
                            <td key={cIdx} className="border p-2 break-words whitespace-normal">{cell !== null && cell !== undefined ? String(cell) : ""}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-muted-foreground p-2">No se pudo generar una vista previa o el archivo está vacío.</div>
                )}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => { /* placeholder: trigger import flow to backend */ }}>
                  Importar datos
                </Button>
                <Button variant="ghost" onClick={() => { setPreviewData([]); setUploadedFile(null); setSuccess(false); }}>
                  Cancelar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}