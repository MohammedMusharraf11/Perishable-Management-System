import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Package, AlertTriangle, TrendingUp, DollarSign, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import {
  AreaChart,
  Area,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useAuth } from "@/contexts/AuthContext";
import React, { useEffect, useState } from "react";
import { CustomChartTooltip } from "@/components/CustomChartTooltip";

// 🧩 Expiry Alert Widget (inline, clean, Manager-only)
const AlertWidget: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!user || user.role !== "Manager") return;

    const fetchAlerts = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/alerts", {
          headers: { "x-user-role": user.role },
        });
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Error fetching alerts:", err);
      }
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 60000);
    return () => clearInterval(interval);
  }, [user]);

  if (!user || user.role !== "Manager" || !data) return null;

  const { expired, high, medium, low, total } = data.counts;

  return (
    <div className="p-4 bg-white shadow-md rounded-2xl w-full max-w-md cursor-pointer hover:shadow-lg transition">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold">Expiry Alerts</h2>
        <span className="bg-red-600 text-white px-2 py-1 rounded-full text-sm font-bold">
          {total}
        </span>
      </div>

      <div className="flex gap-2 mb-3 flex-wrap">
        <span className="bg-black text-white px-3 py-1 rounded-full text-sm">⚫ Expired: {expired}</span>
        <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm animate-pulse">⚠️ High: {high}</span>
        <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm">⚠ Medium: {medium}</span>
        <span className="bg-yellow-400 text-black px-3 py-1 rounded-full text-sm">⏳ Low: {low}</span>
      </div>

      <ul className="text-sm space-y-1">
        {data.topCritical.map((item: any, i: number) => (
          <li key={i} className="flex justify-between border-b pb-1">
            <span>{item.product_name || item.name}</span>
            <span className="text-xs text-gray-500">
              {new Date(item.expiry_date).toLocaleDateString()}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

const Dashboard = () => {
  const statsCards = [
    {
      title: "Total Items",
      value: "847",
      change: "+12 this week",
      icon: Package,
      color: "text-primary",
    },
    {
      title: "Near Expiry",
      value: "23",
      change: "Urgent attention",
      icon: AlertTriangle,
      color: "text-warning",
    },
    {
      title: "Revenue",
      value: "$12,450",
      change: "+8% from last week",
      icon: DollarSign,
      color: "text-success",
    },
    {
      title: "Waste Rate",
      value: "4.2%",
      change: "-0.8% improvement",
      icon: TrendingUp,
      color: "text-destructive",
    },
  ];

  const categoryData = [
    { name: "Mon", items: 120 },
    { name: "Tue", items: 132 },
    { name: "Wed", items: 101 },
    { name: "Thu", items: 134 },
    { name: "Fri", items: 150 },
    { name: "Sat", items: 210 },
    { name: "Sun", items: 180 },
  ];

  const statusData = [
    { name: "Fresh", value: 782, color: "hsl(142, 76%, 36%)" },
    { name: "Near Expiry", value: 52, color: "hsl(36, 100%, 50%)" },
    { name: "Expired", value: 13, color: "hsl(4, 90%, 58%)" },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary-glow to-primary bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">Real-time overview of your inventory health</p>
          </div>
          <Link to="/inventory">
            <Button className="gap-2 gradient-primary shadow-glow">
              Manage Inventory
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* 🧠 Expiry Alerts Widget */}
        <AlertWidget />

        {/* Stats Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        >
          {statsCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <motion.div key={stat.title} variants={itemVariants}>
                <Card className="glass hover:shadow-lg hover:scale-105 transition-all duration-300 border-2 hover:border-primary/30">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </CardTitle>
                    <div
                      className={`p-2 rounded-xl bg-gradient-to-br ${
                        stat.color === "text-primary"
                          ? "from-primary/20 to-primary/10"
                          : stat.color === "text-warning"
                          ? "from-warning/20 to-warning/10"
                          : stat.color === "text-success"
                          ? "from-success/20 to-success/10"
                          : "from-destructive/20 to-destructive/10"
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {stat.change}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="glass hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 rounded-lg gradient-primary">
                    <BarChart className="h-4 w-4 text-white" />
                  </div>
                  Daily Stock Movement
                </CardTitle>
                <CardDescription>Items processed over the past week</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={320}>
                  <AreaChart data={categoryData}>
                    <defs>
                      <linearGradient id="itemsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip content={<CustomChartTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="items"
                      stroke="hsl(var(--primary))"
                      fill="url(#itemsGradient)"
                      strokeWidth={3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="glass hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 rounded-lg gradient-primary">
                    <PieChart className="h-4 w-4 text-white" />
                  </div>
                  Inventory Status
                </CardTitle>
                <CardDescription>Current stock condition breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={110}
                      fill="#8884d8"
                      dataKey="value"
                      strokeWidth={2}
                      stroke="hsl(var(--background))"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomChartTooltip />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
