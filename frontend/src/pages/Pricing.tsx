import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Check, X, TrendingDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Pricing = () => {
  const { toast } = useToast();

  const discounts = [
    {
      id: 1,
      itemName: "Fresh Milk 1L",
      sku: "MILK-001",
      currentPrice: 4.99,
      suggestedPrice: 3.99,
      discount: "20%",
      expiresIn: "2 days",
      reason: "Near expiry",
      status: "pending",
    },
    {
      id: 2,
      itemName: "Organic Yogurt Pack",
      sku: "YOG-045",
      currentPrice: 6.99,
      suggestedPrice: 5.24,
      discount: "25%",
      expiresIn: "1 day",
      reason: "Approaching expiry",
      status: "pending",
    },
    {
      id: 3,
      itemName: "Fresh Bread Loaf",
      sku: "BREAD-012",
      currentPrice: 3.49,
      suggestedPrice: 2.49,
      discount: "30%",
      expiresIn: "Today",
      reason: "Same day expiry",
      status: "pending",
    },
    {
      id: 4,
      itemName: "Salad Mix 200g",
      sku: "SAL-023",
      currentPrice: 5.99,
      suggestedPrice: 4.49,
      discount: "25%",
      expiresIn: "3 days",
      reason: "Near expiry",
      status: "approved",
    },
  ];

  const handleApprove = (itemName: string) => {
    toast({
      title: "Discount Approved",
      description: `${itemName} discount has been applied successfully.`,
    });
  };

  const handleReject = (itemName: string) => {
    toast({
      title: "Discount Rejected",
      description: `${itemName} will maintain current pricing.`,
      variant: "destructive",
    });
  };

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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Dynamic Pricing
            </h1>
            <p className="text-muted-foreground">Review and approve AI-suggested discounts</p>
          </div>
          <div className="glass px-6 py-3 rounded-2xl">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-success" />
              <div>
                <p className="text-sm text-muted-foreground">Potential Savings</p>
                <p className="text-xl font-bold text-foreground">$47.50</p>
              </div>
            </div>
          </div>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-4"
        >
          {discounts.map((item) => (
            <motion.div key={item.id} variants={itemVariants}>
              <Card className="glass hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-foreground">
                          {item.itemName}
                        </h3>
                        <Badge variant="outline" className="text-xs">
                          {item.sku}
                        </Badge>
                        {item.status === "approved" && (
                          <Badge className="bg-success text-success-foreground">
                            Applied
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Current Price</p>
                          <p className="text-lg font-semibold line-through text-muted-foreground">
                            ${item.currentPrice}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-xs text-muted-foreground">Suggested Price</p>
                          <p className="text-lg font-semibold text-success">
                            ${item.suggestedPrice}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-xs text-muted-foreground">Discount</p>
                          <Badge className="mt-1 bg-warning text-warning-foreground">
                            {item.discount} OFF
                          </Badge>
                        </div>
                        
                        <div>
                          <p className="text-xs text-muted-foreground">Expires In</p>
                          <p className="text-sm font-medium text-destructive mt-1">
                            {item.expiresIn}
                          </p>
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mt-3">
                        <span className="font-medium">Reason:</span> {item.reason}
                      </p>
                    </div>

                    {item.status === "pending" && (
                      <div className="flex gap-2 ml-4">
                        <Button
                          size="lg"
                          className="gradient-primary shadow-glow"
                          onClick={() => handleApprove(item.itemName)}
                        >
                          <Check className="mr-2 h-4 w-4" />
                          Approve
                        </Button>
                        <Button
                          size="lg"
                          variant="outline"
                          onClick={() => handleReject(item.itemName)}
                        >
                          <X className="mr-2 h-4 w-4" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </Layout>
  );
};

export default Pricing;
