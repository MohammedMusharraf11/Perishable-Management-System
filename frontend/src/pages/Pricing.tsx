import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, TrendingDown, Loader2, RefreshCw, AlertCircle, Printer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { generatePriceLabels } from "@/utils/labelGenerator";

interface DiscountSuggestion {
  id: string;
  batch_id: string;
  suggested_discount_percentage: number;
  estimated_revenue: number;
  status: string;
  created_at: string;
  stock_batches: {
    id: string;
    quantity: number;
    expiry_date: string;
    items: {
      sku: string;
      name: string;
      base_price: number;
      category: string;
      unit: string;
    };
  };
}

const Pricing = () => {
  const { toast } = useToast();
  const [suggestions, setSuggestions] = useState<DiscountSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState<DiscountSuggestion | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [customDiscount, setCustomDiscount] = useState(0);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);
  
  // Get user role from localStorage
  const currentUser = JSON.parse(localStorage.getItem("pms_user") || "{}");
  const userRole = currentUser.role || "staff";
  const isManager = userRole === "manager";

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      // Managers see pending suggestions, staff see approved ones
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const endpoint = isManager 
        ? `${API_BASE}/api/discount-suggestions/pending`
        : `${API_BASE}/api/discount-suggestions/approved`;
      
      const response = await fetch(endpoint);
      const data = await response.json();
      
      if (data.success) {
        setSuggestions(data.data || []);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch discount suggestions",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      toast({
        title: "Error",
        description: "Failed to connect to server",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_BASE}/api/discount-suggestions/stats`);
      const data = await response.json();
      
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  useEffect(() => {
    fetchSuggestions();
    fetchStats();
  }, []);

  const calculateDaysUntilExpiry = (expiryDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleApproveClick = (suggestion: DiscountSuggestion) => {
    setSelectedSuggestion(suggestion);
    setCustomDiscount(suggestion.suggested_discount_percentage);
    setShowApproveDialog(true);
  };

  const handleRejectClick = (suggestion: DiscountSuggestion) => {
    setSelectedSuggestion(suggestion);
    setRejectionReason("");
    setShowRejectDialog(true);
  };

  const handleApprove = async () => {
    if (!selectedSuggestion) return;
    
    setProcessing(true);
    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(
        `${API_BASE}/api/discount-suggestions/${selectedSuggestion.id}/approve`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            approved_discount_percentage: customDiscount,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Discount Approved",
          description: `${selectedSuggestion.stock_batches.items.name} discount of ${customDiscount}% has been applied.`,
        });
        
        // Auto-generate label after approval
        handlePrintLabelForSuggestion(selectedSuggestion, customDiscount);
        
        setShowApproveDialog(false);
        fetchSuggestions();
        fetchStats();
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to approve discount",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error approving suggestion:", error);
      toast({
        title: "Error",
        description: "Failed to approve discount",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handlePrintLabelForSuggestion = (suggestion: DiscountSuggestion, discount: number) => {
    try {
      const item = suggestion.stock_batches.items;
      generatePriceLabels([{
        sku: item.sku,
        name: item.name,
        category: item.category,
        basePrice: item.base_price,
        currentDiscount: discount,
        expiryDate: suggestion.stock_batches.expiry_date
      }], true);
      
      toast({
        title: "Label Generated",
        description: `Price label ready for ${item.name}`,
      });
    } catch (error) {
      console.error('Label generation error:', error);
      toast({
        title: "Warning",
        description: "Discount approved but label generation failed",
        variant: "destructive",
      });
    }
  };

  const handleReject = async () => {
    if (!selectedSuggestion || !rejectionReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a rejection reason",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(
        `${API_BASE}/api/discount-suggestions/${selectedSuggestion.id}/reject`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            rejection_reason: rejectionReason,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Discount Rejected",
          description: `${selectedSuggestion.stock_batches.items.name} will maintain current pricing.`,
        });
        setShowRejectDialog(false);
        fetchSuggestions();
        fetchStats();
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to reject discount",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error rejecting suggestion:", error);
      toast({
        title: "Error",
        description: "Failed to reject discount",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const triggerAnalysis = async () => {
    setLoading(true);
    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_BASE}/api/discount-suggestions/analyze`, {
        method: "POST",
      });
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Analysis Complete",
          description: `Created ${data.stats?.suggestionsCreated || 0} new suggestions`,
        });
        fetchSuggestions();
        fetchStats();
      } else {
        toast({
          title: "Error",
          description: "Failed to run pricing analysis",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error triggering analysis:", error);
      toast({
        title: "Error",
        description: "Failed to trigger analysis",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-primary dark:text-primary">
              Dynamic Pricing
            </h1>
            <p className="text-muted-foreground">
              {isManager 
                ? "Review and approve AI-suggested discounts" 
                : "View approved discount suggestions"}
            </p>
          </div>
          <div className="flex gap-3">
            {isManager && (
              <Button
                onClick={triggerAnalysis}
                disabled={loading}
                variant="outline"
                className="gap-2"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Run Analysis
              </Button>
            )}
            <div className="glass px-6 py-3 rounded-2xl">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-success" />
                <div>
                  <p className="text-sm text-muted-foreground">Potential Revenue</p>
                  <p className="text-xl font-bold text-foreground">
                    ₹{stats?.totalPotentialRevenue?.toFixed(2) || "0.00"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : suggestions.length === 0 ? (
          <Card className="glass">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {isManager ? "No Pending Suggestions" : "No Approved Discounts"}
              </h3>
              <p className="text-muted-foreground text-center mb-4">
                {isManager 
                  ? "There are no discount suggestions at this time. Run the analysis to generate new suggestions."
                  : "There are no approved discounts at this time. Check back later."}
              </p>
              {isManager && (
                <Button onClick={triggerAnalysis} className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Run Analysis Now
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid gap-4"
          >
            {suggestions.map((suggestion) => {
              const item = suggestion.stock_batches.items;
              const batch = suggestion.stock_batches;
              const daysUntilExpiry = calculateDaysUntilExpiry(batch.expiry_date);
              const currentPrice = item.base_price;
              const suggestedPrice = currentPrice * (1 - suggestion.suggested_discount_percentage / 100);

              return (
                <motion.div key={suggestion.id} variants={itemVariants}>
                  <Card className="glass hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/50">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex-1 min-w-[300px]">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <h3 className="text-lg font-semibold text-foreground">
                              {item.name}
                            </h3>
                            <Badge variant="outline" className="text-xs">
                              {item.sku}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {item.category}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                            <div>
                              <p className="text-xs text-muted-foreground">Current Price</p>
                              <p className="text-lg font-semibold line-through text-muted-foreground">
                                ₹{currentPrice.toFixed(2)}
                              </p>
                            </div>
                            
                            <div>
                              <p className="text-xs text-muted-foreground">Suggested Price</p>
                              <p className="text-lg font-semibold text-success">
                                ₹{suggestedPrice.toFixed(2)}
                              </p>
                            </div>
                            
                            <div>
                              <p className="text-xs text-muted-foreground">Discount</p>
                              <Badge className="mt-1 bg-warning text-warning-foreground">
                                {suggestion.suggested_discount_percentage}% OFF
                              </Badge>
                            </div>
                            
                            <div>
                              <p className="text-xs text-muted-foreground">Expires In</p>
                              <p className={`text-sm font-medium mt-1 ${
                                daysUntilExpiry === 0 ? "text-destructive" :
                                daysUntilExpiry === 1 ? "text-orange-500" :
                                "text-yellow-600"
                              }`}>
                                {daysUntilExpiry === 0 ? "Today" :
                                 daysUntilExpiry === 1 ? "1 day" :
                                 `${daysUntilExpiry} days`}
                              </p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 mt-3">
                            <div>
                              <p className="text-xs text-muted-foreground">Quantity</p>
                              <p className="text-sm font-medium">
                                {batch.quantity} {item.unit || 'units'}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Est. Revenue</p>
                              <p className="text-sm font-medium text-success">
                                ₹{suggestion.estimated_revenue.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          {isManager ? (
                            <>
                              <Button
                                size="lg"
                                className="gradient-primary shadow-glow"
                                onClick={() => handleApproveClick(suggestion)}
                                disabled={processing}
                              >
                                <Check className="mr-2 h-4 w-4" />
                                Approve
                              </Button>
                              <Button
                                size="lg"
                                variant="outline"
                                onClick={() => handleRejectClick(suggestion)}
                                disabled={processing}
                              >
                                <X className="mr-2 h-4 w-4" />
                                Reject
                              </Button>
                            </>
                          ) : (
                            <Badge variant="outline" className="text-sm py-2 px-4">
                              {suggestion.status === "approved" ? "✓ Approved" : "⏳ Pending Manager Approval"}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Discount</DialogTitle>
            <DialogDescription>
              Adjust the discount percentage if needed before approving.
            </DialogDescription>
          </DialogHeader>
          
          {selectedSuggestion && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-1">
                  {selectedSuggestion.stock_batches.items.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {selectedSuggestion.stock_batches.items.sku}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Discount Percentage: {customDiscount}%
                </label>
                <Input
                  type="range"
                  min="0"
                  max="100"
                  value={customDiscount}
                  onChange={(e) => setCustomDiscount(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>

              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm">
                  <span className="text-muted-foreground">New Price: </span>
                  <span className="font-semibold">
                    ₹{(selectedSuggestion.stock_batches.items.base_price * (1 - customDiscount / 100)).toFixed(2)}
                  </span>
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowApproveDialog(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApprove}
              disabled={processing}
              className="gap-2"
            >
              {processing && <Loader2 className="h-4 w-4 animate-spin" />}
              Approve Discount
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Discount</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this discount suggestion.
            </DialogDescription>
          </DialogHeader>
          
          {selectedSuggestion && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-1">
                  {selectedSuggestion.stock_batches.items.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  Suggested discount: {selectedSuggestion.suggested_discount_percentage}%
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Rejection Reason
                </label>
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Enter reason for rejection..."
                  rows={4}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRejectDialog(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={processing || !rejectionReason.trim()}
              className="gap-2"
            >
              {processing && <Loader2 className="h-4 w-4 animate-spin" />}
              Reject Suggestion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Pricing;
