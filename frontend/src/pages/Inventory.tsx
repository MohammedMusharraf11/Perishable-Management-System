import { useState, useEffect, useCallback } from "react";
import axios from "axios"; 
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Plus, Search, Edit, Trash2, X, Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

// API Base URL
const API_URL = import.meta.env.VITE_API_URL; 

// Updated interface to match v_active_inventory view
interface InventoryItem {
  batch_id: string; // This is the UUID from stock_batches.id
  sku: string;
  product_name: string; // Renamed from 'name'
  category: string;
  quantity: number;
  delivery_date: string;
  expiry_date: string;
  days_until_expiry: number; // Pre-calculated by the view
  status: string; // 'ACTIVE', 'EXPIRING_SOON'
}

// New state for the "Add Item" form, matching the new API
const initialFormState = {
  sku: "",
  name: "",
  category: "",
  base_price: 0,
  quantity: 0,
  deliveryDate: "",
  expiryDate: "",
};

const Inventory = () => {
  // State for data and loading
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState(0);

  // State for filters
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  // State for dialogs
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState(initialFormState);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // 300ms delay
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Main data fetching function
  const fetchInventory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (debouncedSearchTerm) params.append("search", debouncedSearchTerm);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (startDate) params.append("startDate", format(startDate, "yyyy-MM-dd"));
      if (endDate) params.append("endDate", format(endDate, "yyyy-MM-dd"));
      
      const response = await axios.get(`${API_URL}/stock`, { params });
      setItems(response.data.data);
      setTotalItems(response.data.count);
    } catch (err) {
      console.error(err);
      const errorMessage = (err as any).response?.data?.message || "Failed to fetch inventory";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearchTerm, statusFilter, startDate, endDate]);

  // Fetch data on filter change
  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  // Helper: Get badge color
  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case "ACTIVE":
        return <Badge className="bg-success">Active</Badge>;
      case "EXPIRING_SOON":
        return <Badge className="bg-warning">Expiring Soon</Badge>;
      case "EXPIRED":
        return <Badge className="bg-destructive">Expired</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };
  
  // Helper: Clear filters
  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setStartDate(undefined);
    setEndDate(undefined);
    toast.info("Filters cleared");
  };

  // Handle input change for the "Add Item" dialog
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setNewItem((prev) => ({
      ...prev,
      [id]: (id === "quantity" || id === "base_price") ? parseFloat(value) : value,
    }));
  };

  // Handle "Add Item" submission
  const handleAddItem = async () => {
    try {
      // Map frontend state to backend API expectations
      const payload = {
        ...newItem,
        deliveryDate: newItem.deliveryDate,
        expiryDate: newItem.expiryDate,
      };

      await axios.post(`${API_URL}/stock`, payload);
      toast.success(`New batch for item "${newItem.name}" added successfully`);
      setIsAddDialogOpen(false);
      setNewItem(initialFormState);
      fetchInventory(); // Refetch data to show new item
    } catch (err) {
      console.error(err);
      const errorMessage = (err as any).response?.data?.message || "Failed to add item";
      toast.error(errorMessage);
    }
  };
  
  // Handle "Delete" button click
  const handleDelete = async (batch_id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete this batch of "${name}"?`)) {
      return;
    }
    
    try {
      await axios.delete(`${API_URL}/stock/${batch_id}`); // Use batch_id (UUID)
      toast.success(`Batch of "${name}" deleted successfully`);
      fetchInventory(); // Refetch data
    } catch (err) {
      console.error(err);
      const errorMessage = (err as any).response?.data?.message || "Failed to delete item";
      toast.error(errorMessage);
    }
  };

  // Render Table Body Content (Loading, Error, Empty, Data)
  const renderTableBody = () => {
    if (isLoading) {
      return (
        <TableRow>
          <TableCell colSpan={9} className="h-24 text-center">
            <div className="flex justify-center items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="text-muted-foreground">Loading inventory...</span>
            </div>
          </TableCell>
        </TableRow>
      );
    }

    if (error) {
      return (
        <TableRow>
          <TableCell colSpan={9} className="h-24 text-center text-destructive">
            Error: {error}
          </TableCell>
        </TableRow>
      );
    }

    if (items.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={9} className="h-24 text-center">
            No active inventory items found. Add one to get started.
          </TableCell>
        </TableRow>
      );
    }

    return items.map((item) => {
      const daysLeft = item.days_until_expiry;
      return (
        <TableRow key={item.batch_id}> 
          <TableCell className="font-medium">{item.sku}</TableCell>
          <TableCell>{item.product_name}</TableCell>
          <TableCell>{item.category}</TableCell>
          <TableCell>{item.quantity}</TableCell>
          <TableCell>
            {format(new Date(item.delivery_date), "dd/MM/yyyy")}
          </TableCell>
          <TableCell>
            {format(new Date(item.expiry_date), "dd/MM/yyyy")}
          </TableCell>
          <TableCell>
            <span
              className={
                daysLeft < 0
                  ? "text-destructive font-medium"
                  : daysLeft <= 3
                  ? "text-warning font-medium"
                  : "text-muted-foreground"
              }
            >
              {daysLeft} days
            </span>
          </TableCell>
          <TableCell>{getStatusBadge(item.status)}</TableCell>
          <TableCell className="text-right">
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => toast.info("Edit functionality coming soon")}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(item.batch_id, item.product_name)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </TableCell>
        </TableRow>
      );
    });
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Inventory</h1>
            <p className="text-muted-foreground">Manage your perishable stock</p>
          </div>

          {/* --- ADD ITEM DIALOG (FORM UPDATED) --- */}
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Item/Batch</DialogTitle>
                <DialogDescription>
                  Enter product info (or SKU of existing) and batch details.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <Label className="text-sm font-medium text-muted-foreground">Product Details</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="sku">SKU</Label>
                    <Input id="sku" placeholder="DAIRY-001" value={newItem.sku} onChange={handleFormChange} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="name">Product Name</Label>
                    <Input id="name" placeholder="Fresh Milk 1L" value={newItem.name} onChange={handleFormChange} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="category">Category</Label>
                    <Input id="category" placeholder="Dairy" value={newItem.category} onChange={handleFormChange} />
                  </div>
                   <div className="grid gap-2">
                    <Label htmlFor="base_price">Base Price</Label>
                    <Input id="base_price" type="number" placeholder="60.00" value={newItem.base_price} onChange={handleFormChange} />
                  </div>
                </div>
                <hr className="my-2" />
                <Label className="text-sm font-medium text-muted-foreground">Batch Details</Label>
                 <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input id="quantity" type="number" placeholder="45" value={newItem.quantity} onChange={handleFormChange} />
                  </div>
                   <div className="grid gap-2">
                    <Label htmlFor="deliveryDate">Delivery Date</Label>
                    <Input id="deliveryDate" type="date" value={newItem.deliveryDate} onChange={handleFormChange} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="expiryDate">Expiry Date</Label>
                    <Input id="expiryDate" type="date" value={newItem.expiryDate} onChange={handleFormChange} />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleAddItem}>
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
                    placeholder="Search by SKU or name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.g.target.value)}
                    className="max-w-sm border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground"
                  />
                </div>

                {/* --- FILTERS ROW (MAPPED TO NEW STATUS) --- */}
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
                        <SelectItem value="all">All Active</SelectItem>
                        <SelectItem value="active">Active (Fresh)</SelectItem>
                        <SelectItem value="expiring-soon">Expiring Soon</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Date Range Filters */}
                  <div className="flex items-center gap-3 bg-muted/30 rounded-lg px-4 py-2 border">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-medium text-muted-foreground">
                        From:
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={`
                              w-[140px] h-8 justify-start text-left font-normal
                              ${!startDate && "text-muted-foreground"}
                              border-muted-foreground/20 focus:border-primary
                            `}
                          >
                            {startDate ? format(startDate, "dd-MM-yyyy") : <span>dd-mm-yyyy</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={startDate}
                            onSelect={setStartDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="h-4 w-px bg-border"></div>
                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-medium text-muted-foreground">
                        To:
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={`
                              w-[140px] h-8 justify-start text-left font-normal
                              ${!endDate && "text-muted-foreground"}
                              border-muted-foreground/20 focus:border-primary
                            `}
                          >
                            {endDate ? format(endDate, "dd-MM-yyyy") : <span>dd-mm-yyyy</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={endDate}
                            onSelect={setEndDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
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
                  Showing {items.length} of {totalItems} batches
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
                    <TableHead>Delivery Date</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Days Left</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {renderTableBody()}
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