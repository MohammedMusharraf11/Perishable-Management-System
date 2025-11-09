import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface User {
  id: string;
  name: string;
  email: string;
  role: "Manager" | "Staff" | "Admin";
  approvalStatus?: "pending" | "approved";
  staff_id?: number;
  is_active?: boolean;
  created_at?: string;
}

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_values: any;
  new_values: any;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

const AdminDashboard = () => {
  const { user, logout, getPendingManagers, approveManager, getAllUsers, createUser, updateUserStatus, resetUserPassword, editUser } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("pending-approvals");
  const [pendingManagers, setPendingManagers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Dialog states
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);

  // Form states
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "Staff" as "Staff" | "Manager"
  });

  const [editUserData, setEditUserData] = useState<User | null>(null);
  const [editUserName, setEditUserName] = useState("");
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");

  // Load data based on active tab
  const loadData = useCallback(async () => {
    if (!user || user.role !== "Admin") return;

    setIsLoading(true);
    try {
      if (activeTab === "pending-approvals") {
        const managers = await getPendingManagers();
        setPendingManagers(managers);
      } else if (activeTab === "user-management") {
        const users = await getAllUsers();
        setAllUsers(users);
      } else if (activeTab === "audit-logs") {
        const logs = await getAuditLogs();
        setAuditLogs(logs);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user, activeTab, getPendingManagers, getAllUsers]);

  // Get audit logs
  const getAuditLogs = async (): Promise<AuditLog[]> => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin/audit-logs/user-management`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch audit logs");
      }

      return data.auditLogs || [];
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      toast.error("Failed to load audit logs");
      return [];
    }
  };

  useEffect(() => {
    if (!user || user.role !== "Admin") {
      navigate("/login");
      return;
    }
    loadData();
  }, [user, navigate, loadData, activeTab]);

  const handleApproveManager = async (managerId: string) => {
    try {
      const success = await approveManager(managerId);
      if (success) {
        await loadData(); // Refresh the list
      }
    } catch (error) {
      console.error("Error approving manager:", error);
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.name || !newUser.password) {
      toast.error("Name and password are required");
      return;
    }

    if (newUser.role === "Manager" && !newUser.email) {
      toast.error("Email is required for Manager role");
      return;
    }

    try {
      await createUser(newUser);
      setIsCreateUserDialogOpen(false);
      setNewUser({ name: "", email: "", password: "", role: "Staff" });
      await loadData(); // Refresh user list
    } catch (error) {
      console.error("Error creating user:", error);
    }
  };

  const handleUpdateUserStatus = async (userId: string, isActive: boolean) => {
    try {
      const success = await updateUserStatus(userId, isActive);
      if (success) {
        await loadData(); // Refresh user list
      }
    } catch (error) {
      console.error("Error updating user status:", error);
    }
  };

  const handleResetPassword = async () => {
    if (!resetPasswordUser || !newPassword) {
      toast.error("New password is required");
      return;
    }

    try {
      const success = await resetUserPassword(resetPasswordUser.id, newPassword);
      if (success) {
        setIsResetPasswordDialogOpen(false);
        setResetPasswordUser(null);
        setNewPassword("");
      }
    } catch (error) {
      console.error("Error resetting password:", error);
    }
  };

  const handleEditUser = async () => {
    if (!editUserData || !editUserName.trim()) {
      toast.error("Name is required");
      return;
    }

    try {
      const success = await editUser(editUserData.id, { name: editUserName });
      if (success) {
        setIsEditUserDialogOpen(false);
        setEditUserData(null);
        setEditUserName("");
        await loadData(); // Refresh user list
      }
    } catch (error) {
      console.error("Error editing user:", error);
    }
  };

  const handleRoleChange = (role: "Staff" | "Manager") => {
    setNewUser(prev => ({
      ...prev,
      role,
      email: role === "Staff" ? "" : prev.email // Clear email when switching to Staff
    }));
  };

  const getStatusBadge = (user: User) => {
    if (!user.is_active) {
      return <Badge variant="destructive">Inactive</Badge>;
    }

    if (user.role === "Manager" && user.approvalStatus === "pending") {
      return <Badge variant="secondary">Pending Approval</Badge>;
    }

    return <Badge variant="default">Active</Badge>;
  };

  const getRoleBadge = (role: string) => {
    const variants = {
      Admin: "bg-purple-100 text-purple-800",
      Manager: "bg-blue-100 text-blue-800",
      Staff: "bg-green-100 text-green-800"
    };

    return (
      <Badge variant="secondary" className={variants[role as keyof typeof variants]}>
        {role}
      </Badge>
    );
  };

  const getActionBadge = (action: string) => {
    const variants: { [key: string]: string } = {
      USER_CREATED: "bg-green-100 text-green-800",
      MANAGER_APPROVED: "bg-blue-100 text-blue-800",
      USER_ACTIVATED: "bg-emerald-100 text-emerald-800",
      USER_DEACTIVATED: "bg-red-100 text-red-800",
      PASSWORD_RESET: "bg-orange-100 text-orange-800",
      USER_UPDATED: "bg-yellow-100 text-yellow-800"
    };

    const actionLabels: { [key: string]: string } = {
      USER_CREATED: "User Created",
      MANAGER_APPROVED: "Manager Approved",
      USER_ACTIVATED: "User Activated",
      USER_DEACTIVATED: "User Deactivated",
      PASSWORD_RESET: "Password Reset",
      USER_UPDATED: "User Updated"
    };

    return (
      <Badge variant="secondary" className={variants[action] || "bg-gray-100 text-gray-800"}>
        {actionLabels[action] || action}
      </Badge>
    );
  };

  const formatAuditData = (data: any) => {
    if (!data) return "N/A";

    try {
      if (typeof data === 'object') {
        return Object.entries(data)
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ');
      }
      return String(data);
    } catch {
      return "N/A";
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col items-center py-10 px-4">
      <Card className="w-full max-w-6xl">
        <CardHeader className="flex flex-row justify-between items-center">
          <CardTitle className="text-2xl">Admin Dashboard</CardTitle>
          <div className="space-x-2">
            <Button variant="outline" onClick={logout}>
              Logout
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pending-approvals">Pending Approvals</TabsTrigger>
              <TabsTrigger value="user-management">User Management</TabsTrigger>
              <TabsTrigger value="audit-logs">Audit Logs</TabsTrigger>
            </TabsList>

            {/* Pending Approvals Tab */}
            <TabsContent value="pending-approvals">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Pending Manager Approvals</h2>
                <Button onClick={loadData} disabled={isLoading}>
                  {isLoading ? "Refreshing..." : "Refresh"}
                </Button>
              </div>

              {isLoading ? (
                <div className="text-center py-8">
                  <p>Loading pending managers...</p>
                </div>
              ) : pendingManagers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-2">No pending manager requests 🎉</p>
                  <p className="text-sm text-muted-foreground">
                    When managers sign up, they will appear here for approval.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingManagers.map((manager) => (
                    <Card key={manager.id} className="p-4">
                      <div className="flex justify-between items-center">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{manager.name}</p>
                            {getRoleBadge(manager.role)}
                            {getStatusBadge(manager)}
                          </div>
                          <p className="text-sm text-muted-foreground">{manager.email}</p>
                          <p className="text-xs text-muted-foreground">
                            Created: {new Date(manager.created_at || "").toLocaleDateString()}
                          </p>
                        </div>
                        <div className="space-x-2">
                          <Button
                            variant="default"
                            onClick={() => handleApproveManager(manager.id)}
                          >
                            Approve ✅
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* User Management Tab */}
            <TabsContent value="user-management">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">User Management</h2>
                <div className="space-x-2">
                  <Button onClick={loadData} disabled={isLoading} variant="outline">
                    {isLoading ? "Refreshing..." : "Refresh"}
                  </Button>
                  <Button onClick={() => setIsCreateUserDialogOpen(true)}>
                    Create User
                  </Button>
                </div>
              </div>

              {isLoading ? (
                <div className="text-center py-8">
                  <p>Loading users...</p>
                </div>
              ) : allUsers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No users found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {allUsers.map((user) => (
                    <Card key={user.id} className="p-4">
                      <div className="flex justify-between items-center">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="font-medium">{user.name}</p>
                            {getRoleBadge(user.role)}
                            {getStatusBadge(user)}
                            {user.staff_id && (
                              <Badge variant="outline">
                                ID: {String(user.staff_id).padStart(3, '0')}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                          <p className="text-xs text-muted-foreground">
                            Created: {new Date(user.created_at || "").toLocaleDateString()}
                          </p>
                        </div>

                        <div className="flex items-center gap-4">
                          {/* Activation Toggle */}
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{user.is_active ? "Active" : "Inactive"}</span>
                            <Switch
                              checked={user.is_active}
                              onCheckedChange={(checked) => handleUpdateUserStatus(user.id, checked)}
                            />
                          </div>

                          {/* Edit Button */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditUserData(user);
                              setEditUserName(user.name);
                              setIsEditUserDialogOpen(true);
                            }}
                          >
                            Edit
                          </Button>

                          {/* Reset Password Button */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setResetPasswordUser(user);
                              setIsResetPasswordDialogOpen(true);
                            }}
                          >
                            Reset Password
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Audit Logs Tab */}
            <TabsContent value="audit-logs">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">User Management Audit Logs</h2>
                <Button onClick={loadData} disabled={isLoading} variant="outline">
                  {isLoading ? "Refreshing..." : "Refresh"}
                </Button>
              </div>

              {isLoading ? (
                <div className="text-center py-8">
                  <p>Loading audit logs...</p>
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No audit logs found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {auditLogs.map((log) => (
                    <Card key={log.id} className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          {getActionBadge(log.action)}
                          <span className="text-sm text-muted-foreground">
                            {new Date(log.created_at).toLocaleString()}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">IP Address:</span> {log.ip_address || "N/A"}
                          </div>
                          <div>
                            <span className="font-medium">User Agent:</span>{" "}
                            {log.user_agent ? log.user_agent.substring(0, 50) + "..." : "N/A"}
                          </div>
                        </div>

                        {(log.old_values || log.new_values) && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm border-t pt-2">
                            {log.old_values && (
                              <div>
                                <span className="font-medium">Before:</span>{" "}
                                <span className="text-muted-foreground">
                                  {formatAuditData(log.old_values)}
                                </span>
                              </div>
                            )}
                            {log.new_values && (
                              <div>
                                <span className="font-medium">After:</span>{" "}
                                <span className="text-muted-foreground">
                                  {formatAuditData(log.new_values)}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={isCreateUserDialogOpen} onOpenChange={setIsCreateUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Create a new staff or manager account.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                placeholder="Enter full name"
                value={newUser.name}
                onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Role *</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="role"
                    value="Staff"
                    checked={newUser.role === "Staff"}
                    onChange={() => handleRoleChange("Staff")}
                  />
                  Staff
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="role"
                    value="Manager"
                    checked={newUser.role === "Manager"}
                    onChange={() => handleRoleChange("Manager")}
                  />
                  Manager
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                Email {newUser.role === "Staff" ? "(Auto-generated)" : "*"}
              </Label>
              <Input
                id="email"
                type="email"
                placeholder={newUser.role === "Staff" ? "Auto-generated for staff" : "Enter email address"}
                value={newUser.email}
                onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                disabled={newUser.role === "Staff"}
                required={newUser.role === "Manager"}
              />
              {newUser.role === "Staff" && (
                <p className="text-xs text-muted-foreground">
                  Email will be auto-generated in format: pms_XXX@gmail.com
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                value={newUser.password}
                onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateUserDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateUser}>
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user details for {editUserData?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editName">Full Name *</Label>
              <Input
                id="editName"
                placeholder="Enter full name"
                value={editUserName}
                onChange={(e) => setEditUserName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editEmail">Email</Label>
              <Input
                id="editEmail"
                type="email"
                value={editUserData?.email || ""}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                {editUserData?.role === "Staff"
                  ? "Staff email cannot be changed (auto-generated)"
                  : "Email changes not supported for managers"
                }
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="editRole">Role</Label>
              <Input
                id="editRole"
                value={editUserData?.role || ""}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">Role cannot be changed after creation</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditUserDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditUser}>
              Update User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Reset password for {resetPasswordUser?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password *</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResetPasswordDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleResetPassword}>
              Reset Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;