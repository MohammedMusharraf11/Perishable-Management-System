import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface User {
  id: string;
  email: string;
  name: string;
  role: "Manager" | "Staff" | "Admin";
  approvalStatus?: "pending" | "approved";
  is_active?: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role?: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: "Manager" | "Staff") => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  getPendingManagers: () => Promise<User[]>; // Changed back to async for DB
  approveManager: (managerId: string) => Promise<boolean>; // Changed back to async for DB
  // New user management functions
  getAllUsers: () => Promise<User[]>;
  createUser: (userData: { name: string; email: string; password: string; role: "Manager" | "Staff" }) => Promise<any>;
  updateUserStatus: (userId: string, isActive: boolean) => Promise<boolean>;
  resetUserPassword: (userId: string, newPassword: string) => Promise<boolean>;
  editUser: (userId: string, userData: { name: string }) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("pms_user");
    const storedToken = localStorage.getItem("pms_token");

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string, role?: string) => {
    setIsLoading(true);
    try {
      // Check hardcoded admin credentials
      if (email === "admin@pms.com" && password === "1234") {
        const adminUser: User = {
          id: "0",
          email,
          name: "Admin",
          role: "Admin",
          approvalStatus: "approved",
          is_active: true,
        };
        localStorage.setItem("pms_user", JSON.stringify(adminUser));
        localStorage.setItem("pms_token", "mock-admin-token");
        setUser(adminUser);
        navigate("/admin");
        return;
      }

      // Staff email pattern validation
      if (role === "Staff") {
        const pattern = /^pms_(\d{3})@gmail\.com$/;
        const match = email.match(pattern);
        if (!match) throw new Error("Invalid Staff email format. Use pms_XXX@gmail.com");
        const idNum = parseInt(match[1]);
        if (idNum < 1 || idNum > 499) throw new Error("Staff ID must be between 001–499");
      }

      // 🔹 Use backend login route (now handles both staff and managers from database)
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      // Store and redirect user
      localStorage.setItem("pms_user", JSON.stringify(data.user));
      localStorage.setItem("pms_token", "jwt-token-" + Date.now());
      setUser(data.user);

      if (data.user.role === "Admin") {
        navigate("/admin");
      } else if (data.user.role === "Manager") {
        navigate("/manager");
      } else {
        navigate("/dashboard");
      }

    } catch (error) {
      console.error("Login error:", error);
      const errorMessage = error instanceof Error ? error.message : "Login failed. Please check your credentials.";
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, role: "Manager" | "Staff") => {
    setIsLoading(true);
    try {
      // 🔹 Use backend register route for both staff and managers
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      if (role === "Staff") {
        // Extract just the ID number from the message for display
        const staffId = data.message.match(/Your Staff ID is: (\d+)/)?.[1];
        if (staffId) {
          toast.success(`Your Staff ID is: ${staffId}`);
        } else {
          toast.success("Staff account created! Please contact admin for login credentials.");
        }
      } else {
        toast.info("Manager account request submitted! Please wait for admin approval before login.");
      }
      
      navigate("/login");

    } catch (err) {
      console.error("Signup error:", err);
      const errorMessage = err instanceof Error ? err.message : "Signup failed.";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Get pending managers from database
  const getPendingManagers = async (): Promise<User[]> => {
    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_BASE}/api/admin/pending-managers`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch pending managers");
      }

      return data.pendingManagers || [];
    } catch (error) {
      console.error("Error fetching pending managers:", error);
      toast.error("Failed to load pending managers");
      return [];
    }
  };

  // Approve a manager in database
  const approveManager = async (managerId: string): Promise<boolean> => {
    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_BASE}/api/admin/approve-manager`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ managerId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to approve manager");
      }

      toast.success("Manager approved successfully!");
      return true;
    } catch (error) {
      console.error("Error approving manager:", error);
      toast.error(error.message || "Failed to approve manager");
      return false;
    }
  };

  // NEW: Get all users for admin management
  const getAllUsers = async (): Promise<User[]> => {
    try:
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_BASE}/api/admin/users`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch users");
      }

      return data.users || [];
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
      return [];
    }
  };

  // NEW: Create user (for admin)
  const createUser = async (userData: { name: string; email: string; password: string; role: "Manager" | "Staff" }): Promise<any> => {
    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_BASE}/api/admin/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create user");
      }

      toast.success("User created successfully!");
      return data;
    } catch (error) {
      console.error("Error creating user:", error);
      toast.error(error.message || "Failed to create user");
      throw error;
    }
  };

  // NEW: Update user status (activate/deactivate)
  const updateUserStatus = async (userId: string, isActive: boolean): Promise<boolean> => {
    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_BASE}/api/admin/users/${userId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ is_active: isActive }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update user status");
      }

      toast.success(`User ${isActive ? "activated" : "deactivated"} successfully!`);
      return true;
    } catch (error) {
      console.error("Error updating user status:", error);
      toast.error(error.message || "Failed to update user status");
      return false;
    }
  };

  // NEW: Reset user password
  const resetUserPassword = async (userId: string, newPassword: string): Promise<boolean> => {
    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_BASE}/api/admin/users/${userId}/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to reset password");
      }

      toast.success("Password reset successfully!");
      return true;
    } catch (error) {
      console.error("Error resetting password:", error);
      toast.error(error.message || "Failed to reset password");
      return false;
    }
  };

  // NEW: Edit user details
const editUser = async (userId: string, userData: { name: string }): Promise<boolean> => {
  try {
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const response = await fetch(`${API_BASE}/api/admin/users/${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to update user");
    }

    toast.success("User updated successfully!");
    return true;
  } catch (error) {
    console.error("Error updating user:", error);
    toast.error(error.message || "Failed to update user");
    return false;
  }
};

  const logout = () => {
    localStorage.removeItem("pms_user");
    localStorage.removeItem("pms_token");
    setUser(null);
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      register, 
      logout, 
      isLoading,
      getPendingManagers,
      approveManager,
      getAllUsers,
      createUser,
      updateUserStatus,
      resetUserPassword,
      editUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};