import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface KPICardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: string;
  onClick?: () => void;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  description,
  icon: Icon,
  trend,
  color = "text-primary",
  onClick,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
      className={onClick ? "cursor-pointer" : ""}
      onClick={onClick}
    >
      <Card className="glass hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/30">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <div
            className={`p-2 rounded-xl bg-gradient-to-br ${
              color === "text-primary"
                ? "from-primary/20 to-primary/10"
                : color === "text-warning"
                ? "from-warning/20 to-warning/10"
                : color === "text-success"
                ? "from-success/20 to-success/10"
                : color === "text-destructive"
                ? "from-destructive/20 to-destructive/10"
                : "from-blue-500/20 to-blue-500/10"
            }`}
          >
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-foreground">{value}</div>
          {description && (
            <CardDescription className="text-xs mt-2">
              {description}
            </CardDescription>
          )}
          {trend && (
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <span className={trend.isPositive ? "text-success" : "text-destructive"}>
                {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
              </span>
              <span>vs last period</span>
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
