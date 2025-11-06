import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export const RoleBasedRedirect = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect based on role
  if (user.role === "Admin") {
    return <Navigate to="/admin" replace />;
  } else if (user.role === "Manager") {
    return <Navigate to="/manager" replace />;
  } else {
    return <Navigate to="/dashboard" replace />;
  }
};
