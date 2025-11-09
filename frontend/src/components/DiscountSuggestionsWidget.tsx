import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingDown, Loader2, ArrowRight, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface DiscountSuggestion {
  id: string;
  suggested_discount_percentage: number;
  estimated_revenue: number;
  stock_batches: {
    quantity: number;
    expiry_date: string;
    items: {
      name: string;
      sku: string;
      base_price: number;
    };
  };
}

interface Stats {
  pending: number;
  totalPotentialRevenue: number;
}

export const DiscountSuggestionsWidget = () => {
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState<DiscountSuggestion[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch pending suggestions
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const suggestionsRes = await fetch(`${API_BASE}/api/discount-suggestions/pending`);
      const suggestionsData = await suggestionsRes.json();
      
      // Fetch stats
      const statsRes = await fetch(`${API_BASE}/api/discount-suggestions/stats`);
      const statsData = await statsRes.json();

      if (suggestionsData.success) {
        setSuggestions(suggestionsData.data?.slice(0, 3) || []); // Show top 3
      }
      
      if (statsData.success) {
        setStats(statsData.data);
      }
    } catch (error) {
      console.error("Error fetching discount suggestions:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDaysUntilExpiry = (expiryDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <Card className="glass border-2 border-primary/10">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <TrendingDown className="h-5 w-5 text-primary" />
          Discount Suggestions
        </CardTitle>
        {stats && stats.pending > 0 && (
          <Badge variant="secondary" className="bg-warning/20 text-warning-foreground">
            {stats.pending} Pending
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : suggestions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              No pending discount suggestions
            </p>
          </div>
        ) : (
          <>
            {/* Stats Summary */}
            {stats && (
              <div className="bg-gradient-to-r from-success/10 to-primary/10 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Potential Revenue</p>
                    <p className="text-2xl font-bold text-foreground">
                      ₹{stats.totalPotentialRevenue.toFixed(2)}
                    </p>
                  </div>
                  <TrendingDown className="h-8 w-8 text-success" />
                </div>
              </div>
            )}

            {/* Top Suggestions */}
            <div className="space-y-3">
              {suggestions.map((suggestion) => {
                const item = suggestion.stock_batches.items;
                const daysUntilExpiry = calculateDaysUntilExpiry(
                  suggestion.stock_batches.expiry_date
                );
                const suggestedPrice = item.base_price * (1 - suggestion.suggested_discount_percentage / 100);

                return (
                  <div
                    key={suggestion.id}
                    className="border rounded-lg p-3 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.sku}</p>
                        
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            {suggestion.suggested_discount_percentage}% OFF
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            ₹{item.base_price} → ₹{suggestedPrice.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className={`text-xs font-medium ${
                          daysUntilExpiry === 0 ? "text-destructive" :
                          daysUntilExpiry === 1 ? "text-orange-500" :
                          "text-yellow-600"
                        }`}>
                          {daysUntilExpiry === 0 ? "Today" :
                           daysUntilExpiry === 1 ? "1 day" :
                           `${daysUntilExpiry} days`}
                        </p>
                        <p className="text-xs text-muted-foreground">expires</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* View All Button */}
            <Button
              variant="outline"
              className="w-full mt-4 gap-2"
              onClick={() => navigate("/pricing")}
            >
              View All Suggestions
              <ArrowRight className="h-4 w-4" />
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};
