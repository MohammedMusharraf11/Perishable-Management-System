import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { motion } from "framer-motion";
import { Download, Calendar as CalendarIcon, Trash2, DollarSign, TrendingDown, Package } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

interface WasteReportData {
  summary: {
    totalItemsWasted: number;
    totalQuantity: number;
    totalEstimatedLoss: number;
  };
  breakdowns: {
    byReason: Array<{
      reason: string;
      count: number;
      quantity: number;
      loss: number;
      percentage: string;
    }>;
    byCategory: Array<{
      category: string;
      count: number;
      quantity: number;
      loss: number;
      percentage: string;
    }>;
    trend: Array<{
      date: string;
      count: number;
      quantity: number;
      loss: number;
    }>;
  };
  detailedItems: Array<{
    id: string;
    date: string;
    sku: string;
    name: string;
    category: string;
    quantity: number;
    reason: string;
    loss: number;
    notes?: string;
  }>;
}

const COLORS = ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'];

const WasteReport = () => {
  const { toast } = useToast();
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [reportData, setReportData] = useState<WasteReportData | null>(null);
  const [loading, setLoading] = useState(false);

  // Set default date range (last 30 days)
  useEffect(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    setStartDate(start);
    setEndDate(end);
  }, []);

  // Fetch report when dates change
  useEffect(() => {
    if (startDate && endDate) {
      fetchWasteReport();
    }
  }, [startDate, endDate]);

  const fetchWasteReport = async () => {
    if (!startDate || !endDate) return;

    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/reports/waste`, {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
      });

      setReportData(response.data);
    } catch (error: any) {
      console.error("Error fetching waste report:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to fetch waste report",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!reportData) return;

    const headers = ["Date", "SKU", "Name", "Category", "Quantity", "Reason", "Loss", "Notes"];
    const rows = reportData.detailedItems.map((item) => [
      format(new Date(item.date), "yyyy-MM-dd HH:mm"),
      item.sku,
      item.name,
      item.category,
      item.quantity,
      item.reason,
      `$${item.loss.toFixed(2)}`,
      item.notes || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `waste-report-${format(startDate!, "yyyy-MM-dd")}-to-${format(endDate!, "yyyy-MM-dd")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "Report exported to CSV",
    });
  };

  const exportToPDF = () => {
    toast({
      title: "PDF Export",
      description: "PDF export functionality coming soon. Use browser print (Ctrl+P) for now.",
    });
    window.print();
  };

  const stats = reportData
    ? [
        {
          title: "Total Items Wasted",
          value: reportData.summary.totalItemsWasted.toString(),
          icon: Trash2,
          color: "text-destructive",
        },
        {
          title: "Total Quantity",
          value: reportData.summary.totalQuantity.toString(),
          icon: Package,
          color: "text-warning",
        },
        {
          title: "Total Estimated Loss",
          value: `$${reportData.summary.totalEstimatedLoss.toFixed(2)}`,
          icon: DollarSign,
          color: "text-destructive",
        },
        {
          title: "Average Loss per Item",
          value:
            reportData.summary.totalItemsWasted > 0
              ? `$${(reportData.summary.totalEstimatedLoss / reportData.summary.totalItemsWasted).toFixed(2)}`
              : "$0.00",
          icon: TrendingDown,
          color: "text-muted-foreground",
        },
      ]
    : [];

  return (
    <Layout>
      <div className="space-y-6 print:space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between print:flex-col print:items-start">
          <div>
            <h1 className="text-3xl font-bold text-primary dark:text-primary">
              Waste Report Generation
            </h1>
            <p className="text-muted-foreground">Analyze waste patterns and costs</p>
          </div>
          <div className="flex gap-2 print:hidden">
            <Button variant="outline" className="gap-2" onClick={exportToCSV} disabled={!reportData}>
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <Button className="gap-2 gradient-primary shadow-glow" onClick={exportToPDF} disabled={!reportData}>
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </div>

        {/* Date Range Selector */}
        <Card className="glass print:hidden">
          <CardHeader>
            <CardTitle>Select Date Range</CardTitle>
            <CardDescription>Choose the period for waste analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-center flex-wrap">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Start Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("w-[240px] justify-start text-left font-normal", !startDate && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">End Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("w-[240px] justify-start text-left font-normal", !endDate && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>

              <Button onClick={fetchWasteReport} disabled={!startDate || !endDate || loading} className="mt-6">
                {loading ? "Generating..." : "Generate Report"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        )}

        {/* Report Content */}
        {!loading && reportData && (
          <>
            {/* Summary Stats */}
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
                        <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                        <Icon className={`h-5 w-5 ${stat.color}`} />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            {/* Charts */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Waste by Reason Pie Chart */}
              <Card className="glass">
                <CardHeader>
                  <CardTitle>Waste Breakdown by Reason</CardTitle>
                  <CardDescription>Distribution of waste causes</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={reportData.breakdowns.byReason}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ reason, percentage }) => `${reason}: ${percentage}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {reportData.breakdowns.byReason.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Waste by Category */}
              <Card className="glass">
                <CardHeader>
                  <CardTitle>Waste by Category</CardTitle>
                  <CardDescription>Product category breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {reportData.breakdowns.byCategory.map((cat, index) => (
                      <motion.div
                        key={cat.category}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-foreground">{cat.category}</span>
                          <span className="text-sm font-bold text-primary">
                            {cat.percentage}% (${cat.loss.toFixed(2)})
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
            </div>

            {/* Waste Trend Chart */}
            {reportData.breakdowns.trend.length > 0 && (
              <Card className="glass">
                <CardHeader>
                  <CardTitle>Waste Trend Over Time</CardTitle>
                  <CardDescription>Daily waste quantity and cost</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={reportData.breakdowns.trend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="quantity" stroke="hsl(var(--destructive))" strokeWidth={2} name="Quantity" />
                      <Line type="monotone" dataKey="loss" stroke="hsl(var(--warning))" strokeWidth={2} name="Loss ($)" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Detailed Items Table */}
            <Card className="glass">
              <CardHeader>
                <CardTitle>Detailed Waste Items</CardTitle>
                <CardDescription>Complete list of wasted items in the selected period</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead className="text-right">Loss</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.detailedItems.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center text-muted-foreground">
                            No waste items found in the selected date range
                          </TableCell>
                        </TableRow>
                      ) : (
                        reportData.detailedItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{format(new Date(item.date), "MMM dd, yyyy HH:mm")}</TableCell>
                            <TableCell className="font-mono">{item.sku}</TableCell>
                            <TableCell>{item.name}</TableCell>
                            <TableCell>{item.category}</TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                            <TableCell>
                              <span className="px-2 py-1 rounded-full text-xs bg-destructive/10 text-destructive">
                                {item.reason}
                              </span>
                            </TableCell>
                            <TableCell className="text-right font-semibold">${item.loss.toFixed(2)}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{item.notes || "-"}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* No Data State */}
        {!loading && !reportData && (
          <Card className="glass">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Trash2 className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground">Select a date range to generate waste report</p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default WasteReport;
