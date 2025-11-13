import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { LucideIcon } from "lucide-react";
import { TrafficLight } from "./TrafficLight";

interface FinancialCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: LucideIcon;
  status?: 'good' | 'warning' | 'danger';
  subtitle?: string;
}

export function FinancialCard({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  status,
  subtitle 
}: FinancialCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="flex items-center gap-2">
          {status && <TrafficLight status={status} size="sm" />}
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
        {change !== undefined && (
          <p className={`text-xs mt-1 ${change >= 0 ? 'text-success' : 'text-destructive'}`}>
            {change >= 0 ? '↑' : '↓'} {Math.abs(change)}% vs mes anterior
          </p>
        )}
      </CardContent>
    </Card>
  );
}
