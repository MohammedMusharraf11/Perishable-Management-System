import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Search, Clock, User, Package, DollarSign, Trash2, Loader2, FileEdit } from "lucide-react";
import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { format } from "date-fns";

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/audit-logs`;

interface AuditLog {
  id: string;
  created_at: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  users?: {
    username: string;
    email: string;
  };
}

const AuditLog = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Fetch audit logs from backend
  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(API_URL, {
        params: { limit: 100 }
      });
      setAuditLogs(response.data.data || []);
      setTotalCount(response.data.count || 0);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch audit logs");
    } finally {
      setIsLoading(false);
    }
  };

  // Mock data for fallback (keeping original structure)
  const mockAuditLogs = [
    {
      id: 1,
      timestamp: "2025-01-23 14:32:15",
      user: "John Manager",
      action: "Approved Discount",
      target: "Fresh Milk 1L (MILK-001)",
      type: "pricing",
      details: "Applied 20% discount - Near expiry",
      icon: DollarSign,
    },
    {
      id: 2,
      timestamp: "2025-01-23 13:18:42",
      user: "Sarah Staff",
      action: "Added Stock",
      target: "Organic Yogurt Pack (YOG-045)",
      type: "inventory",
      details: "Added 24 units, Expires: 2025-01-30",
      icon: Package,
    },
    {
      id: 3,
      timestamp: "2025-01-23 12:45:08",
      user: "Mike Staff",
      action: "Recorded Waste",
      target: "Expired Bread Loaf (BREAD-012)",
      type: "waste",
      details: "Removed 5 units - Expired",
      icon: Trash2,
    },
    {
      id: 4,
      timestamp: "2025-01-23 11:22:33",
      user: "John Manager",
      action: "Updated Stock",
      target: "Salad Mix 200g (SAL-023)",
      type: "inventory",
      details: "Adjusted quantity from 45 to 38 units",
      icon: Package,
    },
    {
      id: 5,
      timestamp: "2025-01-23 10:15:27",
      user: "Sarah Staff",
      action: "Rejected Discount",
      target: "Fresh Cheese 250g (CHE-089)",
      type: "pricing",
      details: "Maintained current pricing",
      icon: DollarSign,
    },
    {
      id: 6,
      timestamp: "2025-01-23 09:08:11",
      user: "Admin System",
      action: "Auto Alert",
      target: "Daily Expiry Check",
      type: "system",
      details: "Generated 12 expiry alerts",
      icon: Clock,
    },
    {
      id: 7,
      timestamp: "2025-01-22 16:42:55",
      user: "John Manager",
      action: "Deleted Item",
      target: "Discontinued Product (OLD-999)",
      type: "inventory",
      details: "Permanently removed from inventory",
      icon: Trash2,
    },
    {
      id: 8,
      timestamp: "2025-01-22 15:33:19",
      user: "Mike Staff",
      action: "Added Stock",
      target: "Fresh Chicken Breast (MEAT-034)",
      type: "inventory",
      details: "Added 15 units, Expires: 2025-01-28",
      icon: Package,
    },
  ];

  // Helper to get icon based on action
  const getActionIcon = (action: string) => {
    if (action.includes('QUANTITY') || action.includes('STOCK')) return Package;
    if (action.includes('DISCOUNT') || action.includes('PRICING')) return DollarSign;
    if (action.includes('DELETE')) return Trash2;
    return FileEdit;
  };

  // Helper to format action name
  const formatAction = (action: string) => {
    return action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  // Helper to get entity type display
  const getEntityTypeDisplay = (entityType: string) => {
    const typeMap: Record<string, string> = {
      'stock_batches': 'inventory',
      'items': 'inventory',
      'transactions': 'inventory',
      'discount_suggestions': 'pricing',
      'waste_logs': 'waste'
    };
    return typeMap[entityType] || 'system';
  };

  // Helper to format details in a readable way
  const formatDetails = (log: AuditLog) => {
    const action = log.action.toUpperCase();
    
    if (action === 'STOCK_ADDED') {
      const values = log.new_values as Record<string, unknown>;
      return `Added ${values?.quantity || 'N/A'} units, SKU: ${values?.sku || 'N/A'}, Expires: ${values?.expiry_date || 'N/A'}`;
    }
    
    if (action === 'QUANTITY_UPDATED') {
      const values = log.new_values as Record<string, unknown>;
      const oldValues = log.old_values as Record<string, unknown>;
      return `Changed quantity from ${oldValues?.quantity || 'N/A'} to ${values?.quantity || 'N/A'} (Reason: ${values?.reason || 'N/A'})`;
    }
    
    if (action === 'STOCK_DELETED') {
      const values = log.old_values as Record<string, unknown>;
      return `Removed ${values?.quantity || 'N/A'} units of SKU: ${values?.sku || 'N/A'}`;
    }
    
    // Default: show key changes
    if (log.new_values) {
      const keys = Object.keys(log.new_values).slice(0, 3);
      return keys.map(key => `${key}: ${log.new_values?.[key]}`).join(', ');
    }
    
    return 'System action performed';
  };

  // Helper to get target name
  const getTargetName = (log: AuditLog) => {
    const newVals = log.new_values as Record<string, unknown>;
    const oldVals = log.old_values as Record<string, unknown>;
    
    return (newVals?.name as string) || 
           (newVals?.sku as string) || 
           (oldVals?.sku as string) || 
           log.entity_type.replace(/_/g, ' ');
  };

  // Convert real audit logs to display format
  const displayLogs = auditLogs.map(log => ({
    id: log.id,
    timestamp: format(new Date(log.created_at), "yyyy-MM-dd HH:mm:ss"),
    user: log.users?.username || log.users?.email || 'System',
    action: formatAction(log.action),
    target: getTargetName(log),
    type: getEntityTypeDisplay(log.entity_type),
    details: formatDetails(log),
    icon: getActionIcon(log.action),
  }));

  const filteredLogs = (displayLogs.length > 0 ? displayLogs : mockAuditLogs).filter(
    (log) =>
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.target.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTypeColor = (type: string) => {
    switch (type) {
      case "pricing":
        return "bg-warning/10 text-warning border-warning/20";
      case "inventory":
        return "bg-primary/10 text-primary border-primary/20";
      case "waste":
        return "bg-destructive/10 text-destructive border-destructive/20";
      case "system":
        return "bg-muted text-muted-foreground border-border";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary dark:text-primary">
              Audit Log
            </h1>
            <p className="text-muted-foreground">Immutable record of all system changes</p>
          </div>
          <div className="glass px-4 py-2 rounded-full">
            <p className="text-sm text-muted-foreground">
              Total Entries: <span className="font-bold text-foreground">{totalCount || auditLogs.length}</span>
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by action, item, or user..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 glass border-2 focus:border-primary/50"
          />
        </div>

        {/* Timeline */}
        {isLoading ? (
          <Card className="glass">
            <CardContent className="p-12 text-center">
              <Loader2 className="h-12 w-12 mx-auto mb-4 text-primary animate-spin" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Loading audit logs...</h3>
            </CardContent>
          </Card>
        ) : (
          <div className="relative space-y-4">
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-primary/50 to-transparent" />

            {filteredLogs.map((log, index) => {
            const Icon = log.icon;
            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="relative pl-16"
              >
                <div className="absolute left-0 top-4 w-12 h-12 rounded-full glass border-2 border-primary flex items-center justify-center shadow-glow">
                  <Icon className="h-5 w-5 text-primary" />
                </div>

                <Card className="glass hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/30">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground">{log.action}</h3>
                          <Badge className={getTypeColor(log.type)}>
                            {log.type}
                          </Badge>
                        </div>

                        <p className="text-sm font-medium text-primary">{log.target}</p>
                        <p className="text-sm text-muted-foreground">{log.details}</p>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t border-border/50">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {log.user}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {log.timestamp}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
          </div>
        )}

        {!isLoading && filteredLogs.length === 0 && (
          <Card className="glass">
            <CardContent className="p-12 text-center">
              <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No results found</h3>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search terms
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default AuditLog;
