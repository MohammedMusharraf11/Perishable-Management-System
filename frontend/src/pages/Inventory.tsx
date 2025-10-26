import { useState, useEffect, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Search, Edit, Trash2, X, Calendar } from "lucide-react";
import { toast } from "sonner";

interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  quantity: number;
  expiryDate: string;
  status: "fresh" | "near-expiry" | "expired";
}

const Inventory = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [items, setItems] = useState<InventoryItem[]>([
    {
      id: "1",
      sku: "DAIRY-001",
      name: "Fresh Milk 1L",
      category: "Dairy",
      quantity: 45,
      expiryDate: "2025-11-05",
      status: "fresh",
    },
    {
      id: "2",
      sku: "MEAT-012",
      name: "Chicken Breast",
      category: "Meat",
      quantity: 12,
      expiryDate: "2025-10-27",
      status: "near-expiry",
    },
    {
      id: "3",
      sku: "BREAD-005",
      name: "Whole Wheat Bread",
      category: "Bakery",
      quantity: 8,
      expiryDate: "2025-10-24",
      status: "expired",
    },
    {
      id: "4",
      sku: "FRUIT-023",
      name: "Strawberries 250g",
      category: "Produce",
      quantity: 30,
      expiryDate: "2025-10-28",
      status: "near-expiry",
    },
    {
      id: "5",
      sku: "DAIRY-008",
      name: "Greek Yogurt",
      category: "Dairy",
      quantity: 67,
      expiryDate: "2025-11-15",
      status: "fresh",
    },
  ]);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Load filter state from sessionStorage on component mount
  useEffect(() => {
    const savedFilters = sessionStorage.getItem('inventoryFilters');
    if (savedFilters) {
      const filters = JSON.parse(savedFilters);
      setSearchTerm(filters.searchTerm || "");
      setStatusFilter(filters.statusFilter || "all");
      setStartDate(filters.startDate || "");
      setEndDate(filters.endDate || "");
    }
  }, []);

  // Save filter state to sessionStorage whenever filters change
  useEffect(() => {
    const filters = {
      searchTerm,
      statusFilter,
      startDate,
      endDate,
    };
    sessionStorage.setItem('inventoryFilters', JSON.stringify(filters));
  }, [searchTerm, statusFilter, startDate, endDate]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "fresh":
        return <Badge className="bg-success">{status}</Badge>;
      case "near-expiry":
        return <Badge className="bg-warning">{status}</Badge>;
      case "expired":
        return <Badge className="bg-destructive">{status}</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    const days = Math.ceil(
      (new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return days;
  };

  const handleDelete = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
    toast.success("Item deleted successfully");
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setStartDate("");
    setEndDate("");
    toast.info("Filters cleared");
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Search filter (case-insensitive)
      const matchesSearch = 
        item.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(debouncedSearchTerm.toLowerCase());

      // Status filter
      const matchesStatus = 
        statusFilter === "all" ||
        (statusFilter === "active" && item.status === "fresh") ||
        (statusFilter === "expiring-soon" && item.status === "near-expiry") ||
        (statusFilter === "expired" && item.status === "expired");

      // Date range filter
      const itemExpiryDate = new Date(item.expiryDate);
      const matchesDateRange = 
        (!startDate || itemExpiryDate >= new Date(startDate)) &&
        (!endDate || itemExpiryDate <= new Date(endDate));

      return matchesSearch && matchesStatus && matchesDateRange;
    });
  }, [items, debouncedSearchTerm, statusFilter, startDate, endDate]);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Inventory</h1>
            <p className="text-muted-foreground">Manage your perishable stock</p>
          </div>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Item</DialogTitle>
                <DialogDescription>
                  Enter the details of the new inventory item
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="sku">SKU</Label>
                  <Input id="sku" placeholder="DAIRY-001" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="name">Product Name</Label>
                  <Input id="name" placeholder="Fresh Milk 1L" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Input id="category" placeholder="Dairy" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input id="quantity" type="number" placeholder="45" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="expiry">Expiry Date</Label>
                  <Input id="expiry" type="date" />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    toast.success("Item added successfully");
                    setIsAddDialogOpen(false);
                  }}
                >
                  Add Item
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Stock Overview</CardTitle>
            <CardDescription>
              <div className="space-y-4 mt-4">
                {/* Search Bar */}
                <div className="flex items-center gap-2 bg-muted/30 rounded-lg px-4 py-2 border">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by SKU, name, or category..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground"
                  />
                </div>

                {/* Filters Row */}
                <div className="flex flex-wrap items-center gap-4">
                  {/* Status Filter */}
                  <div className="flex items-center gap-2 bg-muted/30 rounded-lg px-4 py-2 border">
                    <Label htmlFor="status-filter" className="text-sm font-medium text-muted-foreground">
                      Status:
                    </Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[180px] h-8 border-muted-foreground/20 focus:border-primary">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="expiring-soon">Expiring Soon</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Date Range Filters */}
                  <div className="flex items-center gap-3 bg-muted/30 rounded-lg px-4 py-2 border">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div className="flex items-center gap-2">
                      <Label htmlFor="start-date" className="text-sm font-medium text-muted-foreground">
                        From:
                      </Label>
                      <Input
                        id="start-date"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-[140px] h-8 text-sm border-muted-foreground/20 focus:border-primary"
                      />
                    </div>
                    <div className="h-4 w-px bg-border"></div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="end-date" className="text-sm font-medium text-muted-foreground">
                        To:
                      </Label>
                      <Input
                        id="end-date"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-[140px] h-8 text-sm border-muted-foreground/20 focus:border-primary"
                      />
                    </div>
                  </div>

                  {/* Clear Filters Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    className="gap-2"
                  >
                    <X className="h-4 w-4" />
                    Clear Filters
                  </Button>
                </div>

                {/* Results Count */}
                <div className="text-sm text-muted-foreground">
                  Showing {filteredItems.length} of {items.length} items
                </div>
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Days Left</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.sku}</TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>
                        {new Date(item.expiryDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <span
                          className={
                            getDaysUntilExpiry(item.expiryDate) < 0
                              ? "text-destructive font-medium"
                              : getDaysUntilExpiry(item.expiryDate) <= 3
                              ? "text-warning font-medium"
                              : "text-muted-foreground"
                          }
                        >
                          {getDaysUntilExpiry(item.expiryDate)} days
                        </span>
                      </TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              toast.info("Edit functionality coming soon")
                            }
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(item.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Inventory;
