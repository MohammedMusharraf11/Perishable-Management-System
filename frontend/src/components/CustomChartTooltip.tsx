import { TooltipProps } from 'recharts';

interface CustomTooltipProps extends TooltipProps<any, any> {
  labelFormatter?: (label: string) => string;
}

export const CustomChartTooltip = ({ active, payload, label, labelFormatter }: CustomTooltipProps) => {
  if (!active || !payload || !payload.length) {
    return null;
  }

  return (
    <div className="bg-card border border-border rounded-lg shadow-lg p-3 backdrop-blur-sm">
      {label && (
        <p className="text-sm font-semibold text-foreground mb-2">
          {labelFormatter ? labelFormatter(label) : label}
        </p>
      )}
      <div className="space-y-1">
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-semibold text-foreground">
              {typeof entry.value === 'number' 
                ? entry.value.toLocaleString() 
                : entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
