import { useState } from "react";
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
import { Label } from "@/components/ui/label";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
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

  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              <div className="flex items-center gap-2 mt-4">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by SKU, name, or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
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
