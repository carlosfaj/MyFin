import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { 
  Moon, 
  Sun, 
  Globe, 
  Bell, 
  Shield, 
  Download,
  Trash2,
  User
} from "lucide-react";
import { Input } from "./ui/input";

interface SettingsScreenProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export function SettingsScreen({ isDarkMode, onToggleDarkMode }: SettingsScreenProps) {
  const [userLevel, setUserLevel] = useState("beginner");
  const [currency, setCurrency] = useState("usd");
  const [notifications, setNotifications] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Configuración</h1>
        <p className="text-muted-foreground">Personaliza tu experiencia en MyFin</p>
      </div>

      {/* User Profile */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5" />
            <CardTitle>Perfil de Usuario</CardTitle>
          </div>
          <CardDescription>Información personal y preferencias</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre Completo</Label>
              <Input id="name" placeholder="Juan Pérez" defaultValue="Usuario Invitado" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input id="email" type="email" placeholder="tu@email.com" defaultValue="invitado@myfin.app" />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="level">Nivel de Experiencia</Label>
            <Select value={userLevel} onValueChange={setUserLevel}>
              <SelectTrigger id="level">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Principiante - Explicaciones básicas</SelectItem>
                <SelectItem value="intermediate">Intermedio - Análisis estándar</SelectItem>
                <SelectItem value="advanced">Avanzado - Métricas profesionales</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Esto personaliza las explicaciones y el nivel de detalle de los análisis
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            {isDarkMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            <CardTitle>Apariencia</CardTitle>
          </div>
          <CardDescription>Personaliza el aspecto visual de la aplicación</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Tema Oscuro</Label>
              <p className="text-xs text-muted-foreground">
                Activa el modo oscuro para reducir el cansancio visual
              </p>
            </div>
            <Switch checked={isDarkMode} onCheckedChange={onToggleDarkMode} />
          </div>
        </CardContent>
      </Card>

      {/* Regional */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            <CardTitle>Regional</CardTitle>
          </div>
          <CardDescription>Formato de moneda e idioma</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currency">Moneda Predeterminada</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger id="currency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="usd">🇺🇸 Dólar Estadounidense (USD)</SelectItem>
                <SelectItem value="eur">🇪🇺 Euro (EUR)</SelectItem>
                <SelectItem value="mxn">🇲🇽 Peso Mexicano (MXN)</SelectItem>
                <SelectItem value="cop">🇨🇴 Peso Colombiano (COP)</SelectItem>
                <SelectItem value="ars">🇦🇷 Peso Argentino (ARS)</SelectItem>
                <SelectItem value="clp">🇨🇱 Peso Chileno (CLP)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="language">Idioma</Label>
            <Select defaultValue="es">
              <SelectTrigger id="language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="es">🇪🇸 Español</SelectItem>
                <SelectItem value="en">🇺🇸 English</SelectItem>
                <SelectItem value="pt">🇧🇷 Português</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <CardTitle>Notificaciones</CardTitle>
          </div>
          <CardDescription>Administra tus alertas y recordatorios</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Notificaciones Push</Label>
              <p className="text-xs text-muted-foreground">
                Recibe alertas sobre cambios importantes en tus indicadores
              </p>
            </div>
            <Switch checked={notifications} onCheckedChange={setNotifications} />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Alertas de Ratios Críticos</Label>
              <p className="text-xs text-muted-foreground">
                Te avisamos cuando un ratio sale del rango saludable
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Recordatorios de Actualización</Label>
              <p className="text-xs text-muted-foreground">
                Recibe recordatorios para actualizar tus datos financieros
              </p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Privacy & Data */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <CardTitle>Privacidad y Datos</CardTitle>
          </div>
          <CardDescription>Controla tus datos y privacidad</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Modo Offline</Label>
              <p className="text-xs text-muted-foreground">
                Todos los datos se almacenan localmente en tu dispositivo
              </p>
            </div>
            <Switch checked={offlineMode} onCheckedChange={setOfflineMode} />
          </div>

          <Separator />

          <div className="space-y-3">
            <Label>Gestión de Datos</Label>
            <div className="flex gap-2">
              <Button variant="outline" className="rounded-lg">
                <Download className="mr-2 h-4 w-4" />
                Exportar Mis Datos
              </Button>
              <Button variant="outline" className="rounded-lg text-destructive hover:bg-destructive/10">
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar Todos los Datos
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" className="rounded-lg">
          Cancelar
        </Button>
        <Button className="rounded-lg">
          Guardar Cambios
        </Button>
      </div>
    </div>
  );
}
