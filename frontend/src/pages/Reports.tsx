import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { Download, TrendingUp, TrendingDown, DollarSign, Trash2 } from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const Reports = () => {
  const wasteData = [
    { month: "Jan", waste: 420, cost: 1680 },
    { month: "Feb", waste: 380, cost: 1520 },
    { month: "Mar", waste: 290, cost: 1160 },
    { month: "Apr", waste: 340, cost: 1360 },
    { month: "May", waste: 250, cost: 1000 },
    { month: "Jun", waste: 210, cost: 840 },
  ];

  const salesData = [
    { day: "Mon", sales: 12450, items: 342 },
    { day: "Tue", sales: 13200, items: 367 },
    { day: "Wed", sales: 11800, items: 325 },
    { day: "Thu", sales: 14500, items: 398 },
    { day: "Fri", sales: 16800, items: 456 },
    { day: "Sat", sales: 18900, items: 512 },
    { day: "Sun", sales: 17200, items: 478 },
  ];

  const categoryWaste = [
    { category: "Dairy", percentage: 35 },
    { category: "Produce", percentage: 28 },
    { category: "Bakery", percentage: 22 },
    { category: "Meat", percentage: 15 },
  ];

  const stats = [
    {
      title: "Total Waste (This Month)",
      value: "210 items",
      change: "-16.7%",
      icon: Trash2,
      trend: "down",
      color: "text-success",
    },
    {
      title: "Waste Cost",
      value: "$840",
      change: "-16.7%",
      icon: DollarSign,
      trend: "down",
      color: "text-success",
    },
    {
      title: "Weekly Revenue",
      value: "$104,850",
      change: "+8.2%",
      icon: TrendingUp,
      trend: "up",
      color: "text-primary",
    },
    {
      title: "Waste Rate",
      value: "3.8%",
      change: "-0.9%",
      icon: TrendingDown,
      trend: "down",
      color: "text-success",
    },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Analytics & Reports
            </h1>
            <p className="text-muted-foreground">Track performance and waste trends</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <Button className="gap-2 gradient-primary shadow-glow">
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="glass hover:shadow-lg transition-all duration-300">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </CardTitle>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                    <p className={`text-xs mt-1 flex items-center gap-1 ${stat.color}`}>
                      {stat.trend === "down" ? (
                        <TrendingDown className="h-3 w-3" />
                      ) : (
                        <TrendingUp className="h-3 w-3" />
                      )}
                      {stat.change} from last period
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Charts */}
        <Tabs defaultValue="waste" className="space-y-4">
          <TabsList className="glass">
            <TabsTrigger value="waste">Waste Trends</TabsTrigger>
            <TabsTrigger value="sales">Sales Performance</TabsTrigger>
            <TabsTrigger value="category">Category Breakdown</TabsTrigger>
          </TabsList>

          <TabsContent value="waste" className="space-y-4">
            <Card className="glass">
              <CardHeader>
                <CardTitle>Waste Reduction Over Time</CardTitle>
                <CardDescription>
                  Monthly waste items and associated costs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={wasteData}>
                    <defs>
                      <linearGradient id="wasteGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--warning))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--warning))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="waste"
                      stroke="hsl(var(--destructive))"
                      fill="url(#wasteGradient)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="cost"
                      stroke="hsl(var(--warning))"
                      fill="url(#costGradient)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sales" className="space-y-4">
            <Card className="glass">
              <CardHeader>
                <CardTitle>Weekly Sales Performance</CardTitle>
                <CardDescription>Revenue and items sold per day</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Bar
                      dataKey="sales"
                      fill="hsl(var(--primary))"
                      radius={[8, 8, 0, 0]}
                    />
                    <Bar
                      dataKey="items"
                      fill="hsl(var(--success))"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="category" className="space-y-4">
            <Card className="glass">
              <CardHeader>
                <CardTitle>Waste by Category</CardTitle>
                <CardDescription>Percentage breakdown of waste by product category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categoryWaste.map((cat, index) => (
                    <motion.div
                      key={cat.category}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">
                          {cat.category}
                        </span>
                        <span className="text-sm font-bold text-primary">
                          {cat.percentage}%
                        </span>
                      </div>
                      <div className="h-3 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${cat.percentage}%` }}
                          transition={{ duration: 1, delay: index * 0.1 }}
                          className="h-full gradient-primary"
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Reports;
