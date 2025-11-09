import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Package,
  AlertTriangle,
  DollarSign,
  BarChart3,
  FileText,
  Trash2,
  User,
  LogOut,
} from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const allNavItems = [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard, excludeRole: "Manager" },
    { path: "/manager", label: "Dashboard", icon: LayoutDashboard, requiredRole: "Manager" },
    { path: "/inventory", label: "Inventory", icon: Package },
    { path: "/alerts", label: "Alerts", icon: AlertTriangle },
    { path: "/pricing", label: "Pricing", icon: DollarSign },
    { path: "/reports", label: "Reports", icon: BarChart3 },
    { path: "/waste-report", label: "Waste Report", icon: Trash2, requiredRole: "Manager" },
    { path: "/audit-log", label: "Audit Log", icon: FileText },
  ];

  // Filter nav items based on user role
  const navItems = allNavItems.filter((item) => {
    if (item.requiredRole) {
      return user?.role === item.requiredRole;
    }
    if (item.excludeRole) {
      return user?.role !== item.excludeRole;
    }
    return true;
  });

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="glass border-b border-border/50 sticky top-0 z-50 backdrop-blur-xl"
      >
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to={user?.role === "Manager" ? "/manager" : "/dashboard"} className="flex items-center gap-3 group">
            <img 
              src="/logo.png" 
              alt="PMS Logo" 
              className="h-10 w-10 object-contain group-hover:scale-110 transition-transform duration-300"
            />
            <h1 className="text-xl font-bold text-primary dark:text-primary">
              PMS
            </h1>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant={active ? "default" : "ghost"}
                    size="sm"
                    className={`gap-2 transition-all duration-300 ${
                      active
                        ? "gradient-primary shadow-glow text-white"
                        : "hover:bg-primary/10 hover:text-primary"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link to="/profile">
              <Button
                variant="ghost"
                size="icon"
                className="hidden sm:flex hover:scale-110 transition-transform"
              >
                <User className="h-5 w-5 text-primary" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              className="hover:scale-110 transition-transform hover:text-destructive"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </motion.header>

      {/* Mobile Navigation */}
      <nav className="lg:hidden glass border-b border-border/50 sticky top-16 z-40 backdrop-blur-xl">
        <div className="container mx-auto px-2 py-2 flex overflow-x-auto gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link key={item.path} to={item.path}>
                <Button
                  variant={active ? "default" : "ghost"}
                  size="sm"
                  className={`gap-1 text-xs whitespace-nowrap transition-all duration-300 ${
                    active
                      ? "gradient-primary shadow-glow text-white"
                      : "hover:bg-primary/10 hover:text-primary"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 bg-gradient-to-br from-background via-background to-primary/5">
        <div className="container mx-auto px-4 py-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
};
