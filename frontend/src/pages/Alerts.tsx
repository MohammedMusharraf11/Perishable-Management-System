import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2, Clock, Loader2, DollarSign, Printer, FileText } from "lucide-react";
import { toast } from "sonner";
import { generatePriceLabels } from "@/utils/labelGenerator";

interface Alert {
  id: string;
  sku: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  basePrice: number;
  currentDiscount: number;
  expiryDate: string;
  daysLeft: number;
  urgency: "critical" | "high" | "medium";
}

const Alerts = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      // Fetch expiring items from backend
      const response = await fetch("http://localhost:5000/api/alerts");
      const data = await response.json();

      if (data.success) {
        // Transform the data
        const transformedAlerts: Alert[] = [];
        
        if (data.expired) {
          data.expired.forEach((item: any) => {
            transformedAlerts.push({
              id: item.batch_id,
              sku: item.sku,
              name: item.product_name || item.name,
              category: item.category || 'N/A',
              quantity: item.quantity,
              unit: item.unit || 'units',
              basePrice: item.base_price || 0,
              currentDiscount: item.current_discount || 0,
              expiryDate: item.expiry_date,
              daysLeft: -1,
              urgency: "critical" as const,
            });
          });
        }

        if (data.expiringToday) {
          data.expiringToday.forEach((item: any) => {
            transformedAlerts.push({
              id: item.batch_id,
              sku: item.sku,
              name: item.product_name || item.name,
              category: item.category || 'N/A',
              quantity: item.quantity,
              unit: item.unit || 'units',
              basePrice: item.base_price || 0,
              currentDiscount: item.current_discount || 0,
              expiryDate: item.expiry_date,
              daysLeft: 0,
              urgency: "critical" as const,
            });
          });
        }

        if (data.expiring1Day) {
          data.expiring1Day.forEach((item: any) => {
            transformedAlerts.push({
              id: item.batch_id,
              sku: item.sku,
              name: item.product_name || item.name,
              category: item.category || 'N/A',
              quantity: item.quantity,
              unit: item.unit || 'units',
              basePrice: item.base_price || 0,
              currentDiscount: item.current_discount || 0,
              expiryDate: item.expiry_date,
              daysLeft: 1,
              urgency: "high" as const,
            });
          });
        }

        if (data.expiring2Days) {
          data.expiring2Days.forEach((item: any) => {
            transformedAlerts.push({
              id: item.batch_id,
              sku: item.sku,
              name: item.product_name || item.name,
              category: item.category || 'N/A',
              quantity: item.quantity,
              unit: item.unit || 'units',
              basePrice: item.base_price || 0,
              currentDiscount: item.current_discount || 0,
              expiryDate: item.expiry_date,
              daysLeft: 2,
              urgency: "medium" as const,
            });
          });
        }

        setAlerts(transformedAlerts);
      }
    } catch (error) {
      console.error("Error fetching alerts:", error);
      toast.error("Failed to load alerts");
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "critical":
        return "bg-destructive";
      case "high":
        return "bg-warning";
      case "medium":
        return "bg-warning/70";
      default:
        return "bg-muted";
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case "critical":
        return <AlertTriangle className="h-5 w-5" />;
      case "high":
        return <Clock className="h-5 w-5" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  const handleMarkResolved = (id: string) => {
    toast.success("Alert marked as resolved");
  };

  const handleApplyDiscount = (id: string) => {
    toast.success("Discount applied to item");
  };

  const handlePrintLabel = (alert: Alert) => {
    try {
      generatePriceLabels([{
        sku: alert.sku,
        name: alert.name,
        category: alert.category,
        basePrice: alert.basePrice,
        currentDiscount: alert.currentDiscount,
        expiryDate: alert.expiryDate
      }], true);
      
      toast.success(`Label generated for ${alert.name}`);
    } catch (error) {
      console.error('Label generation error:', error);
      toast.error("Failed to generate label");
    }
  };

  const handlePrintAllLabels = () => {
    const discountedAlerts = alerts.filter(alert => alert.currentDiscount > 0 && alert.daysLeft >= 0);
    
    if (discountedAlerts.length === 0) {
      toast.error("No discounted items to print");
      return;
    }

    try {
      const labelData = discountedAlerts.map(alert => ({
        sku: alert.sku,
        name: alert.name,
        category: alert.category,
        basePrice: alert.basePrice,
        currentDiscount: alert.currentDiscount,
        expiryDate: alert.expiryDate
      }));

      generatePriceLabels(labelData, true);
      toast.success(`Generated ${discountedAlerts.length} labels`);
    } catch (error) {
      console.error('Batch label generation error:', error);
      toast.error("Failed to generate labels");
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary dark:text-primary">Alerts</h1>
            <p className="text-muted-foreground">Items requiring immediate attention</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handlePrintAllLabels}
              disabled={loading || alerts.filter(a => a.currentDiscount > 0 && a.daysLeft >= 0).length === 0}
              variant="default"
              size="sm"
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              Print All Labels ({alerts.filter(a => a.currentDiscount > 0 && a.daysLeft >= 0).length})
            </Button>
            <Button
              onClick={fetchAlerts}
              disabled={loading}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Clock className="h-4 w-4" />
              )}
              Refresh
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-4">
          {alerts.map((alert) => (
            <Card key={alert.id} className="border-l-4" style={{ borderLeftColor: getUrgencyColor(alert.urgency).replace('bg-', 'hsl(var(--') + '))' }}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${getUrgencyColor(alert.urgency)}`}>
                      {getUrgencyIcon(alert.urgency)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-lg">{alert.name}</CardTitle>
                        <Badge className={getUrgencyColor(alert.urgency)}>
                          {alert.urgency}
                        </Badge>
                      </div>
                      <CardDescription>
                        {alert.sku} • {alert.category}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Quantity</p>
                    <p className="text-lg font-semibold">
                      {alert.quantity} {alert.unit}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Base Price</p>
                    <p className="text-lg font-semibold flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      ₹{alert.basePrice.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Current Discount</p>
                    <p className="text-lg font-semibold">
                      {alert.currentDiscount > 0 ? (
                        <span className="text-success">{alert.currentDiscount}% OFF</span>
                      ) : (
                        <span className="text-muted-foreground">None</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Expiry Date</p>
                    <p className="text-lg font-semibold">
                      {new Date(alert.expiryDate).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Days Left</p>
                    <p className={`text-lg font-semibold ${
                      alert.daysLeft < 0 ? 'text-destructive' : 
                      alert.daysLeft === 0 ? 'text-destructive' :
                      alert.daysLeft <= 2 ? 'text-warning' : 
                      'text-foreground'
                    }`}>
                      {alert.daysLeft < 0 ? 'Expired' : 
                       alert.daysLeft === 0 ? 'Today' :
                       `${alert.daysLeft} days`}
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {alert.daysLeft >= 0 ? (
                    <>
                      <Button
                        size="sm"
                        variant="warning"
                        onClick={() => handleApplyDiscount(alert.id)}
                      >
                        Apply Discount
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePrintLabel(alert)}
                      >
                        <Printer className="h-4 w-4 mr-1" />
                        Print Label
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarkResolved(alert.id)}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Mark Resolved
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleMarkResolved(alert.id)}
                      >
                        Remove from Stock
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toast.info("Recording waste...")}
                      >
                        Record Waste
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        )}

        {!loading && alerts.length === 0 && (
          <Card className="glass">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CheckCircle2 className="h-12 w-12 text-success mb-4" />
              <p className="text-xl font-semibold mb-2">No Active Alerts</p>
              <p className="text-muted-foreground">All items are within safe expiry periods</p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default Alerts;
