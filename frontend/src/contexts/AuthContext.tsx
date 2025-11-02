import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import { toast } from "sonner";

interface User {
  id: string;
  email: string;
  name: string;
  role: "Manager" | "Staff" | "Admin";
  approvalStatus?: "pending" | "approved";
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role?: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: "Manager" | "Staff") => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  getPendingManagers: () => User[]; // Changed to sync function for localStorage
  approveManager: (managerEmail: string) => boolean; // Changed to sync function for localStorage
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
        };
        localStorage.setItem("pms_user", JSON.stringify(adminUser));
        localStorage.setItem("pms_token", "mock-admin-token");
        setUser(adminUser);
        navigate("/admin");
        return;
      }

      // 🔹 Check if it's a Manager (in localStorage)
      const storedUsers = JSON.parse(localStorage.getItem("pms_users") || "[]") as Array<{
        id: string;
        email: string;
        password: string;
        name: string;
        role: string;
        approvalStatus: string;
      }>;
      const managerUser = storedUsers.find((u) => 
        u.email === email && u.password === password && u.role === "Manager"
      );

      if (managerUser) {
        // Manager found in localStorage
        if (managerUser.approvalStatus !== "approved") {
          throw new Error("Your manager account is pending admin approval.");
        }

        // Store and redirect approved manager
        const userObj: User = {
          id: managerUser.id,
          email: managerUser.email,
          name: managerUser.name,
          role: "Manager",
          approvalStatus: "approved"
        };
        
        localStorage.setItem("pms_user", JSON.stringify(userObj));
        localStorage.setItem("pms_token", "jwt-token-" + Date.now());
        setUser(userObj);
        navigate("/dashboard");
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

      // 🔹 If not a manager, check Staff in database
      const response = await fetch("http://localhost:5000/api/auth/login", {
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

      // Store and redirect staff user
      localStorage.setItem("pms_user", JSON.stringify(data.user));
      localStorage.setItem("pms_token", "jwt-token-" + Date.now());
      setUser(data.user);
      navigate("/dashboard");

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
      if (role === "Staff") {
        // 🔹 STAFF: Use backend register route (database)
        const response = await fetch("http://localhost:5000/api/auth/register", {
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

        // Extract just the ID number from the message for display
        const staffId = data.message.match(/Your Staff ID is: (\d+)/)?.[1];
        if (staffId) {
          toast.success(`Your Staff ID is: ${staffId}`);
        } else {
          toast.success("Staff account created! Please contact admin for login credentials.");
        }
        navigate("/login");
      } else {
        // 🔹 MANAGER: Use localStorage for approval system
        const storedUsers = JSON.parse(localStorage.getItem("pms_users") || "[]") as Array<{
          id: string;
          email: string;
          password: string;
          name: string;
          role: string;
          approvalStatus: string;
          createdAt?: string;
        }>;
        
        // Check if manager already exists
        const existingManager = storedUsers.find((u) => u.email === email && u.role === "Manager");
        if (existingManager) {
          throw new Error("Manager with this email already exists.");
        }

        // Create manager object for localStorage
        const newManager = {
          id: Date.now().toString(),
          name,
          email,
          password,
          role: "Manager",
          approvalStatus: "pending" as const,
          createdAt: new Date().toISOString()
        };

        // Save to localStorage
        storedUsers.push(newManager);
        localStorage.setItem("pms_users", JSON.stringify(storedUsers));

        toast.info("Manager account request submitted! Please wait for admin approval before login.");
        navigate("/login");
      }
    } catch (err) {
      console.error("Signup error:", err);
      const errorMessage = err instanceof Error ? err.message : "Signup failed.";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // NEW FUNCTION: Get pending managers from localStorage (sync)
  const getPendingManagers = (): User[] => {
    try {
      const storedUsers = JSON.parse(localStorage.getItem("pms_users") || "[]") as Array<{
        id: string;
        email: string;
        name: string;
        role: string;
        approvalStatus: string;
      }>;
      const pendingManagers = storedUsers.filter((u) => 
        u.role === "Manager" && u.approvalStatus === "pending"
      );
      
      // Convert to User interface format
      return pendingManagers.map((manager) => ({
        id: manager.id,
        name: manager.name,
        email: manager.email,
        role: "Manager",
        approvalStatus: "pending"
      }));
    } catch (error) {
      console.error("Error fetching pending managers:", error);
      toast.error("Failed to load pending managers");
      return [];
    }
  };

  // NEW FUNCTION: Approve a manager in localStorage (sync)
  const approveManager = (managerEmail: string): boolean => {
    try {
      const storedUsers = JSON.parse(localStorage.getItem("pms_users") || "[]") as Array<{
        id: string;
        email: string;
        password: string;
        name: string;
        role: string;
        approvalStatus: string;
        createdAt?: string;
      }>;
      
      const updatedUsers = storedUsers.map((u) => {
        if (u.email === managerEmail && u.role === "Manager") {
          return { ...u, approvalStatus: "approved" };
        }
        return u;
      });

      localStorage.setItem("pms_users", JSON.stringify(updatedUsers));
      toast.success("Manager approved successfully!");
      return true;
    } catch (error) {
      console.error("Error approving manager:", error);
      toast.error("Failed to approve manager");
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
      getPendingManagers, // Add new functions
      approveManager 
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