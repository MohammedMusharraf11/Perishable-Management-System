import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface PendingManager {
  id: string;
  name: string;
  email: string;
  role: string;
  approvalStatus: "pending" | "approved" | "rejected";
  password?: string; // Include password for login
}

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [pendingManagers, setPendingManagers] = useState<PendingManager[]>([]);

  // Get users from localStorage
  const getStoredUsers = (): PendingManager[] => {
    return JSON.parse(localStorage.getItem("pms_users") || "[]");
  };

  // Save users to localStorage
  const saveStoredUsers = (users: PendingManager[]) => {
    localStorage.setItem("pms_users", JSON.stringify(users));
  };

  useEffect(() => {
    // Only allow Admin
    if (!user || user.role !== "Admin") {
      navigate("/login");
      return;
    }

    loadPendingManagers();
  }, [user, navigate]);

  const loadPendingManagers = () => {
    const allUsers = getStoredUsers();
    const pending = allUsers.filter(
      (u: PendingManager) => u.role === "Manager" && u.approvalStatus === "pending"
    );
    setPendingManagers(pending);
    console.log("Loaded pending managers:", pending); // Debug log
  };

  const handleApproval = (managerEmail: string, status: "approved" | "rejected") => {
    const allUsers = getStoredUsers();

    const updatedUsers = allUsers.map((u: PendingManager) => {
      if (u.email === managerEmail) {
        return { ...u, approvalStatus: status };
      }
      return u;
    });

    saveStoredUsers(updatedUsers);

    // Update local state
    setPendingManagers(prev =>
      prev.filter(manager => manager.email !== managerEmail)
    );

    toast.success(`Manager ${status === "approved" ? "approved" : "rejected"} successfully`);
  };

  const handleGoToLogin = () => {
    navigate("/login");
  };

  // Debug function to check what's in localStorage
  const debugLocalStorage = () => {
    const allUsers = getStoredUsers();
    console.log("All users in localStorage:", allUsers);
    const managers = allUsers.filter((u: PendingManager) => u.role === "Manager");
    console.log("All managers:", managers);
  };

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col items-center py-10 px-4">
      <Card className="w-full max-w-3xl">
        <CardHeader className="flex flex-row justify-between items-center">
          <CardTitle className="text-2xl">Admin Dashboard</CardTitle>
          <div className="space-x-2">
            <Button variant="outline" onClick={debugLocalStorage}>
              Debug
            </Button>
            <Button variant="outline" onClick={logout}>
              Logout
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <h2 className="text-lg font-semibold mb-4">Pending Manager Approvals</h2>

          {pendingManagers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-2">No pending manager requests 🎉</p>
              <p className="text-sm text-muted-foreground">
                When managers sign up, they will appear here for approval.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingManagers.map((manager) => (
                <Card key={manager.email} className="p-4 flex justify-between items-center">
                  <div>
                    <p className="font-medium">{manager.name}</p>
                    <p className="text-sm text-muted-foreground">{manager.email}</p>
                    <p className="text-xs text-muted-foreground">Status: {manager.approvalStatus}</p>
                  </div>
                  <div className="space-x-2">
                    <Button
                      variant="default"
                      onClick={() => handleApproval(manager.email, "approved")}
                    >
                      Approve ✅
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleApproval(manager.email, "rejected")}
                    >
                      Reject ❌
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Refresh and navigation buttons */}
          <div className="mt-6 flex justify-between">
            <Button
              variant="secondary"
              size="sm"
              onClick={loadPendingManagers}
            >
              Refresh List
            </Button>
            
            <Button
              variant="secondary"
              size="sm"
              onClick={handleGoToLogin}
            >
              Go back to Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;