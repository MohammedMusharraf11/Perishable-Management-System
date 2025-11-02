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
const API_URL = "http://localhost:5000/api/inventory";

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
  deliveryDate: undefined as Date | undefined,
  expiryDate: undefined as Date | undefined,
  supplier_batch_number: "",
};

// State for Update Quantity modal
const initialUpdateState = {
  batchId: "",
  productName: "",
  currentQuantity: 0,
  quantityChange: 0,
  reason: "SALE",
  notes: "",
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
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState(initialFormState);
  const [updateData, setUpdateData] = useState(initialUpdateState);

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

      console.log('Fetching from:', `${API_URL}/stock`);
      const response = await axios.get(`${API_URL}/stock`, { params });
      console.log('Full Response:', response);
      console.log('Response.data:', response.data);
      console.log('Response.data.data:', response.data.data);

      // Backend returns { data: [...], count: ... }
      const inventoryData = response.data.data || [];
      console.log('Setting items:', inventoryData);

      setItems(inventoryData);
      setTotalItems(response.data.count || 0);
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
    // Validation
    if (!newItem.deliveryDate || !newItem.expiryDate) {
      toast.error("Please select both delivery and expiry dates");
      return;
    }

    try {
      // Map frontend state to backend API expectations
      const payload = {
        ...newItem,
        deliveryDate: format(newItem.deliveryDate, "yyyy-MM-dd"),
        expiryDate: format(newItem.expiryDate, "yyyy-MM-dd"),
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

  // Handle "Update Quantity" button click
  const handleOpenUpdateDialog = (item: InventoryItem) => {
    setUpdateData({
      batchId: item.batch_id,
      productName: item.product_name,
      currentQuantity: item.quantity,
      quantityChange: 0,
      reason: "SALE",
      notes: "",
    });
    setIsUpdateDialogOpen(true);
  };

  // Handle "Update Quantity" submission
  const handleUpdateQuantity = async () => {
    if (updateData.quantityChange === 0) {
      toast.error("Please enter a quantity change");
      return;
    }

    const newQuantity = updateData.currentQuantity + updateData.quantityChange;
    if (newQuantity < 0) {
      toast.error("Resulting quantity cannot be negative");
      return;
    }

    try {
      await axios.put(`${API_URL}/stock/${updateData.batchId}`, {
        quantityChange: updateData.quantityChange,
        reason: updateData.reason,
        notes: updateData.notes,
      });
      
      toast.success(`Quantity updated successfully for "${updateData.productName}"`);
      setIsUpdateDialogOpen(false);
      setUpdateData(initialUpdateState);
      fetchInventory(); // Refetch data
    } catch (err) {
      console.error(err);
      const errorMessage = (err as any).response?.data?.message || "Failed to update quantity";
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

    if (!items || items.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={9} className="h-24 text-center">
            No active inventory items found. Add one to get started.
          </TableCell>
        </TableRow>
      );
    }

    return Array.isArray(items) && items.map((item) => {
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
                onClick={() => handleOpenUpdateDialog(item)}
                title="Update Quantity"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(item.batch_id, item.product_name)}
                title="Delete Batch"
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
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input id="quantity" type="number" placeholder="45" value={newItem.quantity} onChange={handleFormChange} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Delivery Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={`justify-start text-left font-normal ${!newItem.deliveryDate && "text-muted-foreground"}`}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {newItem.deliveryDate ? format(newItem.deliveryDate, "dd-MM-yyyy") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={newItem.deliveryDate}
                            onSelect={(date) => setNewItem(prev => ({ ...prev, deliveryDate: date }))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="grid gap-2">
                      <Label>Expiry Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={`justify-start text-left font-normal ${!newItem.expiryDate && "text-muted-foreground"}`}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {newItem.expiryDate ? format(newItem.expiryDate, "dd-MM-yyyy") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={newItem.expiryDate}
                            onSelect={(date) => setNewItem(prev => ({ ...prev, expiryDate: date }))}
                            initialFocus
                            disabled={(date) => newItem.deliveryDate ? date < newItem.deliveryDate : false}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="supplier_batch_number">Supplier Batch Number (Optional)</Label>
                  <Input id="supplier_batch_number" placeholder="BATCH-2025-001" value={newItem.supplier_batch_number} onChange={handleFormChange} />
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

          {/* --- UPDATE QUANTITY DIALOG --- */}
          <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Update Quantity</DialogTitle>
                <DialogDescription>
                  Adjust stock quantity for {updateData.productName}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Current Quantity</Label>
                  <Input value={updateData.currentQuantity} disabled className="bg-muted" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="quantityChange">Quantity Change</Label>
                  <Input 
                    id="quantityChange" 
                    type="number" 
                    placeholder="Enter positive or negative number (e.g., -5 for sale, +10 for return)"
                    value={updateData.quantityChange}
                    onChange={(e) => setUpdateData(prev => ({ ...prev, quantityChange: parseInt(e.target.value) || 0 }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    New quantity will be: {updateData.currentQuantity + updateData.quantityChange}
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="reason">Reason</Label>
                  <Select 
                    value={updateData.reason} 
                    onValueChange={(value) => setUpdateData(prev => ({ ...prev, reason: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SALE">Sale</SelectItem>
                      <SelectItem value="RETURN">Return</SelectItem>
                      <SelectItem value="ADJUSTMENT">Adjustment</SelectItem>
                      <SelectItem value="TRANSFER">Transfer</SelectItem>
                      <SelectItem value="WASTE">Waste</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Input 
                    id="notes" 
                    placeholder="Additional context..."
                    value={updateData.notes}
                    onChange={(e) => setUpdateData(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsUpdateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleUpdateQuantity}>
                  Update Quantity
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
                    onChange={(e) => setSearchTerm(e.target.value)}
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