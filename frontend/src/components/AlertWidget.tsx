import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertTriangle, Clock, Package, ArrowRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface AlertData {
  counts: {
    expired: number;
    high: number;
    medium: number;
    low: number;
    total: number;
  };
  topCritical: {
    product_name?: string;
    name?: string;
    expiry_date: string;
    category?: string;
    quantity?: number;
  }[];
  timestamp: string;
}

const AlertWidget: React.FC = () => {
  const [data, setData] = useState<AlertData | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.role !== "Manager") return;

    const fetchAlerts = async () => {
      try {
        const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const res = await fetch(`${API_BASE}/api/alerts`, {
          headers: { "x-user-role": user.role },
        });
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Failed to fetch alerts:", err);
      }
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 60000);
    return () => clearInterval(interval);
  }, [user]);

  if (!user || user.role !== "Manager" || !data) return null;

  const { expired, high, medium, low, total } = data.counts;

  return (
    <motion.div
      className="w-full cursor-pointer"
      onClick={() => navigate("/inventory?filter=expiring")}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="glass border-2 border-primary/10 shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.01]">
        {/* 🔹 Header: REMOVED sm:justify-between TO LEFT ALIGN ALL CONTENT */}
        <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <CardTitle className="text-lg font-semibold">
              Expiry Alerts
            </CardTitle>
          </div>
          <motion.span
            className="px-3 py-1 bg-destructive text-white rounded-full text-sm font-semibold shadow-sm mt-2 sm:mt-0 sm:ml-4" // Added sm:ml-4 for a small space
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            {total}
          </motion.span>
        </CardHeader>

        {/* 🔸 Alert Summary Badges */}
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2 mb-2">
            <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium shadow-sm">
              🔴 Expired: {expired}
            </span>
            <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-medium animate-pulse">
              🟠 Today: {high}
            </span>
            <span className="bg-yellow-400 text-black px-3 py-1 rounded-full text-sm font-medium">
              🟡 48h: {medium + low}
            </span>
          </div>

          {/* Divider */}
          <div className="border-t border-border/60 my-2"></div>

          {/* 🧾 Top Critical Items */}
          <div className="bg-accent/30 rounded-lg p-3 border border-border/50">
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Top Critical Items
            </h3>

            {data.topCritical.length === 0 ? (
              <p className="text-sm text-muted-foreground italic text-center py-2">
                No critical items 🎉
              </p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {data.topCritical.map((item, i) => {
                  const name = item.product_name || item.name || "Unnamed Item";
                  const date = new Date(item.expiry_date);
                  const diffHrs =
                    (date.getTime() - new Date().getTime()) / (1000 * 60 * 60);

                  let label = "";
                  if (diffHrs < 0) label = "Expired";
                  else if (diffHrs <= 24) label = "Today";
                  else if (diffHrs <= 48) label = "Soon";
                  else label = "Upcoming";

                  const color =
                    label === "Expired"
                      ? "text-red-600"
                      : label === "Today"
                      ? "text-orange-500"
                      : label === "Soon"
                      ? "text-yellow-500"
                      : "text-muted-foreground";

                  return (
                    <motion.li
                      key={i}
                      className="flex justify-between items-center py-1.5"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {name}
                        </span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span
                          className={`text-xs font-semibold leading-tight ${color}`}
                        >
                          {label}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {date.toLocaleDateString()}
                        </span>
                      </div>
                    </motion.li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end mt-3">
            <span className="flex items-center text-xs text-primary font-medium hover:underline">
              View all expiring items
              <ArrowRight className="h-3 w-3 ml-1" />
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AlertWidget;