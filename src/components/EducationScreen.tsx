import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { 
  BookOpen, 
  GraduationCap, 
  Award, 
  CheckCircle2, 
  Circle,
  PlayCircle
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";

const courses = [
  {
    id: 1,
    title: "Fundamentos de Análisis Financiero",
    description: "Aprende los conceptos básicos del análisis financiero",
    progress: 75,
    lessons: 8,
    completed: 6,
    level: "Principiante"
  },
  {
    id: 2,
    title: "Razones Financieras Avanzadas",
    description: "Domina el cálculo e interpretación de ratios",
    progress: 40,
    lessons: 12,
    completed: 5,
    level: "Intermedio"
  },
  {
    id: 3,
    title: "Análisis Vertical y Horizontal",
    description: "Técnicas de comparación de estados financieros",
    progress: 0,
    lessons: 6,
    completed: 0,
    level: "Principiante"
  }
];

const quizQuestions = [
  {
    question: "¿Qué mide la razón corriente?",
    options: [
      "Rentabilidad de la empresa",
      "Capacidad de pago a corto plazo",
      "Nivel de endeudamiento",
      "Eficiencia operativa"
    ],
    correct: 1
  },
  {
    question: "Un ROE del 15% significa que...",
    options: [
      "La empresa tiene 15% de deuda",
      "Los activos generan 15% de retorno",
      "El patrimonio genera 15% de retorno",
      "Las ventas crecieron 15%"
    ],
    correct: 2
  }
];

export function EducationScreen() {
  const [currentQuiz, setCurrentQuiz] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleAnswerClick = (index: number) => {
    setSelectedAnswer(index);
  };

  const handleSubmit = () => {
    setShowResult(true);
  };

  const handleNext = () => {
    setCurrentQuiz((prev) => (prev + 1) % quizQuestions.length);
    setSelectedAnswer(null);
    setShowResult(false);
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Centro Educativo</h1>
        <p className="text-muted-foreground">
          Aprende análisis financiero de forma interactiva
        </p>
      </div>

      <Tabs defaultValue="courses" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
          <TabsTrigger value="courses">
            <BookOpen className="h-4 w-4 mr-2" />
            Cursos
          </TabsTrigger>
          <TabsTrigger value="concepts">
            <GraduationCap className="h-4 w-4 mr-2" />
            Conceptos
          </TabsTrigger>
          <TabsTrigger value="quiz">
            <Award className="h-4 w-4 mr-2" />
            Quiz
          </TabsTrigger>
        </TabsList>

        {/* Courses Tab */}
        <TabsContent value="courses" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {courses.map((course) => (
              <Card key={course.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{course.title}</CardTitle>
                      <Badge variant="outline">{course.level}</Badge>
                    </div>
                    <PlayCircle className="h-5 w-5 text-primary" />
                  </div>
                  <CardDescription>{course.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progreso</span>
                      <span className="font-semibold">{course.progress}%</span>
                    </div>
                    <Progress value={course.progress} />
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{course.completed}/{course.lessons} lecciones</span>
                  </div>
                  <Button className="w-full rounded-lg">
                    {course.progress === 0 ? 'Comenzar' : 'Continuar'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Concepts Tab */}
        <TabsContent value="concepts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Glosario Financiero Interactivo</CardTitle>
              <CardDescription>Conceptos clave explicados de forma simple</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      <span>Razón Corriente</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3">
                    <p>
                      La <strong>razón corriente</strong> es un indicador de liquidez que mide la 
                      capacidad de una empresa para pagar sus deudas a corto plazo.
                    </p>
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-sm font-mono">
                        Razón Corriente = Activos Corrientes / Pasivos Corrientes
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm"><strong>Interpretación:</strong></p>
                      <ul className="text-sm space-y-1 ml-4 list-disc">
                        <li>Mayor a 2.0: Excelente liquidez</li>
                        <li>Entre 1.5 - 2.0: Liquidez aceptable</li>
                        <li>Menor a 1.0: Problemas de liquidez</li>
                      </ul>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      <span>ROE (Return on Equity)</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3">
                    <p>
                      El <strong>ROE</strong> mide la rentabilidad que obtienen los accionistas 
                      sobre su inversión en la empresa.
                    </p>
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-sm font-mono">
                        ROE = (Utilidad Neta / Patrimonio) × 100
                      </p>
                    </div>
                    <p className="text-sm">
                      Un ROE del 15% significa que por cada $100 de patrimonio, se generan 
                      $15 de utilidad. Valores superiores al 15% son considerados excelentes.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      <span>Análisis Vertical</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3">
                    <p>
                      El <strong>análisis vertical</strong> expresa cada partida como un porcentaje 
                      del total, permitiendo identificar la composición y estructura financiera.
                    </p>
                    <p className="text-sm">
                      Por ejemplo, si tus gastos de ventas son $50,000 y tus ingresos totales 
                      $200,000, los gastos representan el 25% de los ingresos.
                    </p>
                    <div className="bg-primary/10 p-3 rounded-lg">
                      <p className="text-sm">
                        💡 <strong>Útil para:</strong> Comparar empresas de diferentes tamaños o 
                        analizar la evolución de la estructura financiera.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      <span>Análisis Horizontal</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3">
                    <p>
                      El <strong>análisis horizontal</strong> compara los cambios de las partidas 
                      financieras a lo largo del tiempo.
                    </p>
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-sm font-mono">
                        Variación % = ((Año Actual - Año Anterior) / Año Anterior) × 100
                      </p>
                    </div>
                    <p className="text-sm">
                      Ayuda a identificar tendencias, patrones de crecimiento y áreas que 
                      requieren atención.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-5">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      <span>Nivel de Endeudamiento</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3">
                    <p>
                      Indica qué porcentaje de los activos está financiado con deuda.
                    </p>
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-sm font-mono">
                        Endeudamiento = (Pasivo Total / Activo Total) × 100
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm"><strong>Rangos recomendados:</strong></p>
                      <ul className="text-sm space-y-1 ml-4 list-disc">
                        <li className="text-success">0% - 40%: Bajo riesgo</li>
                        <li className="text-warning">41% - 60%: Riesgo moderado</li>
                        <li className="text-destructive">Más de 60%: Alto riesgo</li>
                      </ul>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quiz Tab */}
        <TabsContent value="quiz" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Quiz de Conocimientos</CardTitle>
                  <CardDescription>
                    Pregunta {currentQuiz + 1} de {quizQuestions.length}
                  </CardDescription>
                </div>
                <Award className="h-8 w-8 text-warning" />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <Progress value={((currentQuiz + 1) / quizQuestions.length) * 100} />
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">
                  {quizQuestions[currentQuiz].question}
                </h3>
                
                <div className="space-y-2">
                  {quizQuestions[currentQuiz].options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleAnswerClick(index)}
                      disabled={showResult}
                      className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                        selectedAnswer === index
                          ? showResult
                            ? index === quizQuestions[currentQuiz].correct
                              ? 'border-success bg-success/10'
                              : 'border-destructive bg-destructive/10'
                            : 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      } ${showResult && index === quizQuestions[currentQuiz].correct ? 'border-success bg-success/10' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        {showResult ? (
                          index === quizQuestions[currentQuiz].correct ? (
                            <CheckCircle2 className="h-5 w-5 text-success" />
                          ) : selectedAnswer === index ? (
                            <Circle className="h-5 w-5 text-destructive" />
                          ) : (
                            <Circle className="h-5 w-5 text-muted-foreground" />
                          )
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground" />
                        )}
                        <span>{option}</span>
                      </div>
                    </button>
                  ))}
                </div>

                {showResult && (
                  <div className={`p-4 rounded-lg ${
                    selectedAnswer === quizQuestions[currentQuiz].correct
                      ? 'bg-success/10 border border-success'
                      : 'bg-destructive/10 border border-destructive'
                  }`}>
                    <p className="font-semibold">
                      {selectedAnswer === quizQuestions[currentQuiz].correct
                        ? '¡Correcto! 🎉'
                        : 'Incorrecto. Inténtalo de nuevo.'}
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  {!showResult ? (
                    <Button 
                      onClick={handleSubmit} 
                      disabled={selectedAnswer === null}
                      className="rounded-lg"
                    >
                      Verificar Respuesta
                    </Button>
                  ) : (
                    <Button onClick={handleNext} className="rounded-lg">
                      Siguiente Pregunta
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-2">
                  <p className="text-3xl font-bold text-primary">12</p>
                  <p className="text-sm text-muted-foreground">Quizzes Completados</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-2">
                  <p className="text-3xl font-bold text-success">85%</p>
                  <p className="text-sm text-muted-foreground">Puntuación Promedio</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-2">
                  <p className="text-3xl font-bold text-warning">3</p>
                  <p className="text-sm text-muted-foreground">Insignias Ganadas</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
