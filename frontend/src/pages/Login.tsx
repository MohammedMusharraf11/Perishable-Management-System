import React,{ useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Package } from "lucide-react";
import { toast } from "sonner";
import  RoleSelector  from "@/components/RoleSelector";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState("Staff");
  const [isLoading, setIsLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      // redirect user to their dashboard based on role
      if (user.role === "Admin") navigate("/admin");
      else if (user.role === "Manager") navigate("/manager");
      else navigate("/staff");
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
      // 🔹 Staff-specific email validation
  if (selectedRole === "Staff") {
    const staffEmailPattern = /^pms_(\d{3})@gmail\.com$/;
    const match = email.match(staffEmailPattern);

    if (!match) {
      toast.error("Invalid email format. Use format: pms_XXX@gmail.com (e.g., pms_001@gmail.com)");
      return;
    }

    const num = parseInt(match[1], 10);
    if (num < 1 || num > 499) {
      toast.error("Staff ID must be between 001 and 499");
      return;
    }
  }

    setIsLoading(true);
    try {
      await login(email, password, selectedRole);
    } catch (error: any) {
      toast.error(error.message || "Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-primary rounded-full p-3">
              <Package className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">Perishables Management</CardTitle>
          <CardDescription>Sign in to manage your inventory</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 🔹 Role selection */}
            <RoleSelector
              selectedRole={selectedRole}
              setSelectedRole={setSelectedRole}
              mode="login"
            />

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="manager@store.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          {/* Signup Link */}
          {selectedRole !== "Admin" && (
            <div className="text-center mt-4 text-sm">
              <span className="text-muted-foreground">
                Don’t have an account?{" "}
              </span>
              <Link
                to="/signup"
                className="text-primary font-medium hover:underline"
              >
                Sign up
              </Link>
            </div>
          )}

          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-muted rounded-lg text-sm">
            <p className="font-medium mb-2">Demo Credentials:</p>
            <p className="text-muted-foreground">🧑‍💼 Manager: manager@store.com</p>
            <p className="text-muted-foreground">👷 Staff: staff@store.com</p>
            <p className="text-muted-foreground">👑 Admin: admin@pms.com / 1234</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
