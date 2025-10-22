import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Upload, FileSpreadsheet, FileJson, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";

export function DataImportScreen() {
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleFileUpload = (fileType: string) => {
    setImporting(true);
    setUploadedFile(fileType);
    
    setTimeout(() => {
      setImporting(false);
      setSuccess(true);
    }, 2000);
  };

  return (
    <div className="space-y-6 p-6">
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
              onClick={() => handleFileUpload('xlsx')}
              disabled={importing}
            >
              <Upload className="mr-2 h-4 w-4" />
              Subir XLSX
            </Button>
          </CardContent>
        </Card>

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

        <Card className="hover:shadow-lg transition-all cursor-pointer hover:scale-105">
          <CardHeader>
            <FileJson className="h-8 w-8 text-warning" />
            <CardTitle className="text-lg">JSON (.json)</CardTitle>
            <CardDescription>JavaScript Object Notation</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full rounded-lg" 
              variant="outline"
              onClick={() => handleFileUpload('json')}
              disabled={importing}
            >
              <Upload className="mr-2 h-4 w-4" />
              Subir JSON
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all cursor-pointer hover:scale-105">
          <CardHeader>
            <FileText className="h-8 w-8 text-destructive" />
            <CardTitle className="text-lg">XML (.xml)</CardTitle>
            <CardDescription>Extensible Markup Language</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full rounded-lg" 
              variant="outline"
              onClick={() => handleFileUpload('xml')}
              disabled={importing}
            >
              <Upload className="mr-2 h-4 w-4" />
              Subir XML
            </Button>
          </CardContent>
        </Card>
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
            <Button variant="outline" className="rounded-lg">
              <FileText className="mr-2 h-4 w-4" />
              Descargar Plantilla CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {uploadedFile && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>Vista Previa de Datos Importados</CardTitle>
            <CardDescription>Archivo: ejemplo_estados_financieros.{uploadedFile}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between p-2 bg-muted rounded">
                <span>Total de registros:</span>
                <span className="font-semibold">47</span>
              </div>
              <div className="flex justify-between p-2 bg-muted rounded">
                <span>Periodos detectados:</span>
                <span className="font-semibold">2024, 2023</span>
              </div>
              <div className="flex justify-between p-2 bg-muted rounded">
                <span>Estados financieros:</span>
                <span className="font-semibold">Balance General, Estado de Resultados</span>
              </div>
              <div className="flex justify-between p-2 bg-success/10 rounded">
                <span className="text-success">Estado de validación:</span>
                <span className="font-semibold text-success flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" />
                  Validado correctamente
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
