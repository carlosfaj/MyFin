import { useState, useEffect } from "react";
import { LoginScreen } from "./components/LoginScreen";
import { DashboardScreen } from "./components/DashboardScreen";
import { AnalysisScreen } from "./components/AnalysisScreen";
import { ChatAssistant } from "./components/ChatAssistant";
import { DataImportScreen } from "./components/DataImportScreen";
import { EducationScreen } from "./components/EducationScreen";
import { SettingsScreen } from "./components/SettingsScreen";
import { Button } from "./components/ui/button";
import { 
  LayoutDashboard, 
  BarChart3, 
  MessageSquare, 
  Upload, 
  GraduationCap, 
  Settings,
  Menu,
  X,
  LogOut
} from "lucide-react";
import "./styles/globals.css";

type Screen = 'dashboard' | 'analysis' | 'chat' | 'import' | 'education' | 'settings';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const formatDate = (d: Date) =>
    d.toLocaleString(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const [lastUpdate, setLastUpdate] = useState<string>(() => formatDate(new Date()));

  useEffect(() => {
    if (!isLoggedIn) return;
    setLastUpdate(formatDate(new Date()));
    const id = setInterval(() => setLastUpdate(formatDate(new Date())), 60_000);
    return () => clearInterval(id);
  }, [isLoggedIn]);

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentScreen('dashboard');
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const menuItems = [
    { id: 'dashboard' as Screen, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'analysis' as Screen, label: 'Análisis Detallado', icon: BarChart3 },
    { id: 'chat' as Screen, label: 'Asistente IA', icon: MessageSquare },
    { id: 'import' as Screen, label: 'Importar Datos', icon: Upload },
    { id: 'education' as Screen, label: 'Educación', icon: GraduationCap },
    { id: 'settings' as Screen, label: 'Configuración', icon: Settings },
  ];

  if (!isLoggedIn) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case 'dashboard':
        return <DashboardScreen />;
      case 'analysis':
        return <AnalysisScreen />;
      case 'chat':
        return <ChatAssistant />;
      case 'import':
        return <DataImportScreen />;
      case 'education':
        return <EducationScreen />;
      case 'settings':
        return <SettingsScreen isDarkMode={isDarkMode} onToggleDarkMode={toggleDarkMode} />;
      default:
        return <DashboardScreen />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside 
        className={`
          fixed lg:static inset-y-0 left-0 z-50 w-64 bg-card border-r border-border
          transform transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-primary">MyFin</h2>
              <button 
                className="lg:hidden"
                onClick={() => setIsSidebarOpen(false)}
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Análisis Financiero IA</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentScreen === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentScreen(item.id);
                    setIsSidebarOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                    ${isActive 
                      ? 'bg-primary text-white shadow-md' 
                      : 'hover:bg-muted text-foreground'
                    }
                  `}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-semibold">UI</span>
              </div>
              <div>
                <p className="text-sm font-medium">Usuario Invitado</p>
                <p className="text-xs text-muted-foreground">invitado@myfin.app</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              className="w-full rounded-lg" 
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="bg-card border-b border-border p-4 lg:px-6">
          <div className="flex items-center justify-between">
            <button
              className="lg:hidden"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
            
            <div className="hidden lg:flex items-center gap-4">
              <div className="flex items-center gap-2 bg-success/10 text-success px-3 py-1.5 rounded-full text-sm">
                <span className="w-2 h-2 bg-success rounded-full animate-pulse"></span>
                Sistema Activo
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden md:block text-right mr-3">
                <p className="text-xs text-muted-foreground">Última actualización</p>
                <p className="text-sm font-medium">{lastUpdate}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Screen Content */}
        <div className="flex-1 overflow-auto">
          {renderScreen()}
        </div>
      </main>
    </div>
  );
}

export default App;
