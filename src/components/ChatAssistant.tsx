import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Send, Bot, User, Lightbulb } from "lucide-react";

interface Message {
  id: number;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

const suggestedQuestions = [
  "¿Qué es la razón corriente?",
  "¿Cómo puedo mejorar mi rentabilidad?",
  "Explica el análisis vertical",
  "¿Mi nivel de endeudamiento es saludable?"
];

const aiResponses: { [key: string]: string } = {
  "default": "Soy tu asistente financiero con IA. Puedo ayudarte a entender conceptos financieros, analizar tus ratios y sugerir mejoras. ¿En qué puedo asistirte hoy?",
  "razón corriente": "La **razón corriente** mide tu capacidad para pagar deudas a corto plazo. Se calcula dividiendo activos corrientes entre pasivos corrientes. Un valor entre 2.0 y 3.0 es ideal. Tu razón actual de 2.5 indica excelente liquidez. 💰",
  "rentabilidad": "Para mejorar la rentabilidad, te sugiero: 1) Reducir costos operativos sin afectar calidad, 2) Aumentar el margen de productos premium, 3) Optimizar la rotación de inventario. Tu ROE actual de 18.5% es muy bueno, pero siempre hay espacio para crecer. 📈",
  "análisis vertical": "El **análisis vertical** muestra la proporción de cada partida respecto al total. Por ejemplo, si tus gastos operativos son $120K y tus ingresos $450K, representan el 26.7%. Esto te ayuda a identificar qué áreas consumen más recursos y dónde optimizar. 📊",
  "endeudamiento": "Tu nivel de endeudamiento del 45% está en zona de **precaución** (amarillo). Lo ideal es mantenerlo bajo 50%. Recomiendo: 1) No tomar nuevas deudas por ahora, 2) Destinar parte de utilidades a reducir pasivos, 3) Incrementar activos productivos. ⚠️"
};

export function ChatAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: 'ai',
      text: '¡Hola! 👋 Soy tu asistente financiero inteligente. Estoy aquí para ayudarte a entender tus números y tomar mejores decisiones. ¿Tienes alguna pregunta sobre tu análisis financiero?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: messages.length + 1,
      sender: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);

    // Simple AI response logic
    setTimeout(() => {
      let responseText = aiResponses.default;
      const lowerInput = input.toLowerCase();
      
      for (const [key, value] of Object.entries(aiResponses)) {
        if (lowerInput.includes(key)) {
          responseText = value;
          break;
        }
      }

      const aiMessage: Message = {
        id: messages.length + 2,
        sender: 'ai',
        text: responseText,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    }, 1000);

    setInput("");
  };

  const handleQuestionClick = (question: string) => {
    setInput(question);
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Asistente Financiero IA</h1>
        <p className="text-muted-foreground">Pregunta lo que necesites saber</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="h-[600px] flex flex-col">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                <CardTitle>Chat Interactivo</CardTitle>
              </div>
              <CardDescription>
                Haz preguntas sobre conceptos financieros o análisis
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${
                        message.sender === 'user' ? 'flex-row-reverse' : ''
                      }`}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className={message.sender === 'ai' ? 'bg-primary text-white' : 'bg-muted'}>
                          {message.sender === 'ai' ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={`rounded-lg p-3 max-w-[80%] ${
                          message.sender === 'user'
                            ? 'bg-primary text-white'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-line">{message.text}</p>
                        <p className={`text-xs mt-1 ${
                          message.sender === 'user' ? 'text-white/70' : 'text-muted-foreground'
                        }`}>
                          {message.timestamp.toLocaleTimeString('es-ES', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="flex gap-2 mt-4 pt-4 border-t">
                <Input
                  placeholder="Escribe tu pregunta aquí..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  className="rounded-lg"
                />
                <Button onClick={handleSend} size="icon" className="rounded-lg">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-warning" />
                <CardTitle>Preguntas Sugeridas</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {suggestedQuestions.map((question, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  className="w-full justify-start text-left h-auto py-3 rounded-lg"
                  onClick={() => handleQuestionClick(question)}
                >
                  {question}
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-primary/10 to-success/10">
            <CardHeader>
              <CardTitle className="text-sm">💡 Consejo del Día</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                El <strong>análisis de tendencias</strong> es más valioso que los números aislados. 
                Observa cómo evolucionan tus ratios mes a mes para tomar decisiones informadas.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Temas que puedo explicar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
                <span>Razones de liquidez</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-success"></div>
                <span>Indicadores de rentabilidad</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-warning"></div>
                <span>Análisis de endeudamiento</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-destructive"></div>
                <span>Ratios de actividad</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-muted-foreground"></div>
                <span>Análisis vertical y horizontal</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
