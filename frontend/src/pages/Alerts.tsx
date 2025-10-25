import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";

interface Alert {
  id: string;
  sku: string;
  name: string;
  category: string;
  quantity: number;
  expiryDate: string;
  daysLeft: number;
  urgency: "critical" | "high" | "medium";
}

const Alerts = () => {
  const alerts: Alert[] = [
    {
      id: "1",
      sku: "BREAD-005",
      name: "Whole Wheat Bread",
      category: "Bakery",
      quantity: 8,
      expiryDate: "2025-10-24",
      daysLeft: -1,
      urgency: "critical",
    },
    {
      id: "2",
      sku: "MEAT-012",
      name: "Chicken Breast",
      category: "Meat",
      quantity: 12,
      expiryDate: "2025-10-27",
      daysLeft: 2,
      urgency: "critical",
    },
    {
      id: "3",
      sku: "FRUIT-023",
      name: "Strawberries 250g",
      category: "Produce",
      quantity: 30,
      expiryDate: "2025-10-28",
      daysLeft: 3,
      urgency: "high",
    },
    {
      id: "4",
      sku: "DAIRY-015",
      name: "Cheddar Cheese",
      category: "Dairy",
      quantity: 15,
      expiryDate: "2025-10-30",
      daysLeft: 5,
      urgency: "medium",
    },
  ];

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

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Alerts</h1>
          <p className="text-muted-foreground">Items requiring immediate attention</p>
        </div>

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
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Quantity</p>
                    <p className="text-lg font-semibold">{alert.quantity}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Expiry Date</p>
                    <p className="text-lg font-semibold">
                      {new Date(alert.expiryDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Days Left</p>
                    <p className={`text-lg font-semibold ${
                      alert.daysLeft < 0 ? 'text-destructive' : 
                      alert.daysLeft <= 2 ? 'text-warning' : 
                      'text-foreground'
                    }`}>
                      {alert.daysLeft < 0 ? 'Expired' : `${alert.daysLeft} days`}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="text-lg font-semibold">
                      {alert.daysLeft < 0 ? 'Remove' : 'Discount'}
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

        {alerts.length === 0 && (
          <Card>
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
