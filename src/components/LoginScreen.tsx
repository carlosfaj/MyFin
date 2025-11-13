import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { TrendingUp, Shield, Brain } from "lucide-react";

interface LoginScreenProps {
  onLogin: (asGuest?: boolean) => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:4000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        onLogin(false);
      } else {
        alert(data.message || "Credenciales inválidas");
      }
    } catch (error) {
      alert("Error de conexión con el login.");
      console.error("Login error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-success/10 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center">
        {/* Left Side - Branding */}
        <div className="hidden md:block space-y-6">
          <div className="space-y-2">
            <h1 className="text-5xl font-bold text-primary">MyFin</h1>
            <p className="text-xl text-muted-foreground">
              Análisis Financiero Inteligente
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Análisis Avanzado</h3>
                <p className="text-sm text-muted-foreground">
                  Análisis vertical, horizontal y razones financieras automatizadas
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <Brain className="h-6 w-6 text-success" />
              </div>
              <div>
                <h3 className="font-semibold">IA Educativa</h3>
                <p className="text-sm text-muted-foreground">
                  Asistente inteligente que explica conceptos y sugiere mejoras
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="p-2 bg-warning/10 rounded-lg">
                <Shield className="h-6 w-6 text-warning" />
              </div>
              <div>
                <h3 className="font-semibold">Privacidad Total</h3>
                <p className="text-sm text-muted-foreground">
                  Modo offline disponible - Tus datos siempre seguros
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <Card className="shadow-2xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl md:hidden">MyFin</CardTitle>
            <CardTitle>Iniciar Sesión</CardTitle>
            <CardDescription>
              Ingresa tus credenciales para acceder a tu análisis financiero
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-lg"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded-lg"
                />
              </div>

              <Button type="submit" className="w-full rounded-lg">
                Iniciar Sesión
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  O continúa como
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full rounded-lg"
              onClick={() => onLogin(true)}
            >
              Acceder como Invitado
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Al continuar, aceptas nuestros términos de servicio y política de privacidad
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
