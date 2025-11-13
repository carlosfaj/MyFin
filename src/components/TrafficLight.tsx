interface TrafficLightProps {
  status: 'good' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function TrafficLight({ status, size = 'md', showLabel = false }: TrafficLightProps) {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-6 h-6'
  };

  const colorClasses = {
    good: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-destructive'
  };

  const labels = {
    good: 'Saludable',
    warning: 'Precaución',
    danger: 'Crítico'
  };

  return (
    <div className="flex items-center gap-2">
      <div 
        className={`${sizeClasses[size]} ${colorClasses[status]} rounded-full shadow-sm`}
        style={{
          boxShadow: `0 0 8px ${status === 'good' ? '#00B894' : status === 'warning' ? '#FFC107' : '#E74C3C'}`
        }}
      />
      {showLabel && (
        <span className="text-xs text-muted-foreground">{labels[status]}</span>
      )}
    </div>
  );
}
