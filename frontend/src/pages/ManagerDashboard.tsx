import React, { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { KPICard } from "@/components/KPICard";
import { DateRangeSelector } from "@/components/DateRangeSelector";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  TrendingDown,
  AlertTriangle,
  Tag,
  TrendingUp,
  DollarSign,
  BarChart3,
  LineChart as LineChartIcon,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { EmailNotificationTrigger } from "@/components/EmailNotificationTrigger";

/* ------------------------- TYPES ------------------------- */
interface KPIData {
  totalWasteValue: number;
  itemsExpiringToday: number;
  activeDiscounts: number;
  inventoryTurnoverRate: number;
  revenueFromDiscounts: number;
}

interface DashboardData {
  success: boolean;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  kpis: KPIData;
  trends: {
    dailyWaste: Array<{
      date: string;
      value: number;
      count: number;
    }>;
  };
}

/* -------------------- MANAGER DASHBOARD -------------------- */
const ManagerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date().toISOString(),
  });

  const fetchDashboardData = async (start?: string, end?: string) => {
    try {
      setIsLoading(true);
      const startDate = start || dateRange.startDate;
      const endDate = end || dateRange.endDate;

      const response = await fetch(
        `http://localhost:5000/api/reports/dashboard?startDate=${startDate}&endDate=${endDate}`
      );

      if (!response.ok) throw new Error("Failed to fetch dashboard data");

      const data: DashboardData = await response.json();
      setDashboardData(data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleDateRangeChange = (startDate: string, endDate: string) => {
    setDateRange({ startDate, endDate });
    fetchDashboardData(startDate, endDate);
  };

  const handleKPIClick = (route: string) => navigate(route);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  if (isLoading && !dashboardData)
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </Layout>
    );

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary-glow to-primary bg-clip-text text-transparent">
              Manager Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Real-time KPIs and inventory insights
            </p>
          </div>
          <DateRangeSelector onDateRangeChange={handleDateRangeChange} />
        </div>

        {/* KPI Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-5"
        >
          <KPICard
            title="Total Waste Value"
            value={`₹${dashboardData?.kpis.totalWasteValue.toFixed(2) || 0}`}
            description="This period"
            icon={TrendingDown}
            color="text-destructive"
            onClick={() => handleKPIClick("/waste-report")}
          />
          <KPICard
            title="Items Expiring Today"
            value={dashboardData?.kpis.itemsExpiringToday || 0}
            description="Requires immediate attention"
            icon={AlertTriangle}
            color="text-warning"
            onClick={() => handleKPIClick("/alerts")}
          />
          <KPICard
            title="Active Discounts"
            value={dashboardData?.kpis.activeDiscounts || 0}
            description="Items on discount"
            icon={Tag}
            color="text-primary"
            onClick={() => handleKPIClick("/pricing")}
          />
          <KPICard
            title="Inventory Turnover"
            value={`${dashboardData?.kpis.inventoryTurnoverRate || 0}%`}
            description="Sales vs inventory"
            icon={TrendingUp}
            color="text-success"
            onClick={() => handleKPIClick("/inventory")}
          />
          <KPICard
            title="Revenue from Discounts"
            value={`₹${dashboardData?.kpis.revenueFromDiscounts.toFixed(2) || 0}`}
            description="This period"
            icon={DollarSign}
            color="text-success"
            onClick={() => handleKPIClick("/reports")}
          />
        </motion.div>

        {/* Charts Section */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Line Chart */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="glass hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 rounded-lg gradient-primary">
                    <LineChartIcon className="h-4 w-4 text-white" />
                  </div>
                  Daily Waste Trend
                </CardTitle>
                <CardDescription>Waste value over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={dashboardData?.trends.dailyWaste || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="date"
                      stroke="hsl(var(--muted-foreground))"
                      tickFormatter={(value) =>
                        new Date(value).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })
                      }
                    />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "12px",
                      }}
                      formatter={(value: number) => [`₹${value.toFixed(2)}`, "Waste Value"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="hsl(var(--destructive))"
                      strokeWidth={3}
                      dot={{ fill: "hsl(var(--destructive))", r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Bar Chart */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="glass hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 rounded-lg gradient-primary">
                    <BarChart3 className="h-4 w-4 text-white" />
                  </div>
                  Items Wasted Per Day
                </CardTitle>
                <CardDescription>Number of items wasted daily</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={dashboardData?.trends.dailyWaste || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="date"
                      stroke="hsl(var(--muted-foreground))"
                      tickFormatter={(value) =>
                        new Date(value).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })
                      }
                    />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "12px",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Email Notification Trigger */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <EmailNotificationTrigger />
        </motion.div>

        <div className="text-center text-xs text-muted-foreground">
          Dashboard auto-refreshes every 5 minutes
        </div>
      </div>
    </Layout>
  );
};

export default ManagerDashboard;
