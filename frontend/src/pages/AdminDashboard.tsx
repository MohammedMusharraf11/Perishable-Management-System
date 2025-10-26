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
}

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [pendingManagers, setPendingManagers] = useState<PendingManager[]>([]);

  // Get users from the correct localStorage key
  const getStoredUsers = (): PendingManager[] => {
    return JSON.parse(localStorage.getItem("pms_users") || "[]");
  };

  useEffect(() => {
    // Only allow Admin
    if (!user || user.role !== "Admin") {
      navigate("/login");
      return;
    }

    // Load pending managers from localStorage
    const allUsers = getStoredUsers();
    const pending = allUsers.filter(
      (u: PendingManager) => u.role === "Manager" && u.approvalStatus === "pending"
    );
    setPendingManagers(pending);
  }, [user, navigate]);

  const handleApproval = (email: string, status: "approved" | "rejected") => {
    const allUsers = getStoredUsers();

    const updatedUsers = allUsers.map((u: PendingManager) => {
      if (u.email === email) {
        return { ...u, approvalStatus: status };
      }
      return u;
    });

    localStorage.setItem("pms_users", JSON.stringify(updatedUsers));

    setPendingManagers((prev) =>
      prev.filter((u) => u.email !== email)
    );

    toast.success(`Manager ${status === "approved" ? "approved" : "rejected"} successfully`);
  };

  const handleGoToLogin = () => {
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col items-center py-10 px-4">
      <Card className="w-full max-w-3xl">
        <CardHeader className="flex flex-row justify-between items-center">
          <CardTitle className="text-2xl">Admin Dashboard</CardTitle>
          <Button variant="outline" onClick={logout}>
            Logout
          </Button>
        </CardHeader>

        <CardContent>
          <h2 className="text-lg font-semibold mb-4">Pending Manager Approvals</h2>

          {pendingManagers.length === 0 ? (
            <p className="text-muted-foreground">No pending manager requests 🎉</p>
          ) : (
            <div className="space-y-4">
              {pendingManagers.map((manager) => (
                <Card key={manager.id} className="p-4 flex justify-between items-center">
                  <div>
                    <p className="font-medium">{manager.name}</p>
                    <p className="text-sm text-muted-foreground">{manager.email}</p>
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

          {/* ✅ Go back to login button */}
          <div className="mt-6 text-center">
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