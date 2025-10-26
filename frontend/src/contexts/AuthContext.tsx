import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock database for storing users (replace with actual backend)
const getStoredUsers = (): User[] => {
  return JSON.parse(localStorage.getItem("pms_users") || "[]");
};

const saveUserToStorage = (user: User) => {
  const users = getStoredUsers();
  const existingUserIndex = users.findIndex(u => u.email === user.email);
  
  if (existingUserIndex >= 0) {
    users[existingUserIndex] = user;
  } else {
    users.push(user);
  }
  
  localStorage.setItem("pms_users", JSON.stringify(users));
};

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

    // Check stored users for regular users
    const storedUsers = getStoredUsers();
    const foundUser = storedUsers.find(u => u.email === email);
    
    if (!foundUser) {
      throw new Error("User not found. Please check your credentials.");
    }

    // Check if manager is approved
    if (foundUser.role === "Manager" && foundUser.approvalStatus !== "approved") {
      throw new Error("Your manager account is pending admin approval.");
    }

    // Check password (in real app, this would be hashed)
    // For demo, we'll accept any password for existing users
    
    const mockToken = "mock-jwt-token-" + Date.now();
    localStorage.setItem("pms_user", JSON.stringify(foundUser));
    localStorage.setItem("pms_token", mockToken);
    setUser(foundUser);

    // FIXED: Redirect both Managers and Staff to dashboard
    if (foundUser.role === "Admin") {
      navigate("/admin");
    } else {
      navigate("/dashboard"); // Both Managers and Staff go here
    }
  } catch (error: any) {
    console.error("Login error:", error);
    throw new Error(error.message || "Login failed. Please check your credentials.");
  } finally {
    setIsLoading(false);
  }
};

  const register = async (name: string, email: string, password: string, role: "Manager" | "Staff") => {
    setIsLoading(true);
    try {
      // Check if user already exists
      const storedUsers = getStoredUsers();
      if (storedUsers.find(u => u.email === email)) {
        throw new Error("User with this email already exists.");
      }

      const newUser: User = {
        id: String(Date.now()),
        email,
        name,
        role,
        approvalStatus: role === "Manager" ? "pending" : "approved",
      };

      // Save to mock database
      saveUserToStorage(newUser);

      // For staff, log them in automatically
      if (role === "Staff") {
        const mockToken = "mock-jwt-token-" + Date.now();
        localStorage.setItem("pms_user", JSON.stringify(newUser));
        localStorage.setItem("pms_token", mockToken);
        setUser(newUser);
        navigate("/dashboard");
      } else {
        // For managers, don't auto-login, redirect to login page
        navigate("/login");
      }
    } catch (error: any) {
      console.error("Signup error:", error);
      throw new Error(error.message || "Signup failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("pms_user");
    localStorage.removeItem("pms_token");
    setUser(null);
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
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