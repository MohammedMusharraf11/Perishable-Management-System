import React from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Info } from "lucide-react";

interface RoleSelectorProps {
  selectedRole: string;
  setSelectedRole: (role: string) => void;
  mode: "login" | "signup";
}

const RoleSelector: React.FC<RoleSelectorProps> = ({
  selectedRole,
  setSelectedRole,
  mode
}) => {
  return (
    <div className="space-y-3">
      <Label>Sign in as:</Label>
      <RadioGroup 
        value={selectedRole} 
        onValueChange={setSelectedRole} 
        className="flex space-x-4"
      >
        {mode === "login" ? (
          // For login: Show all three roles
          <>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Staff" id="staff-login" />
              <Label htmlFor="staff-login" className="cursor-pointer">Staff</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Manager" id="manager-login" />
              <Label htmlFor="manager-login" className="cursor-pointer">Manager</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Admin" id="admin-login" />
              <Label htmlFor="admin-login" className="cursor-pointer">Admin</Label>
            </div>
          </>
        ) : (
          // For signup: Show only Staff and Manager
          <>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Staff" id="staff-signup" />
              <Label htmlFor="staff-signup" className="cursor-pointer">Staff</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Manager" id="manager-signup" />
              <Label htmlFor="manager-signup" className="cursor-pointer">Manager</Label>
            </div>
          </>
        )}
      </RadioGroup>
      
      {/* Manager Approval Message for Signup */}
      {mode === "signup" && selectedRole === "Manager" && (
        <div className="flex items-start space-x-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-blue-700">
            Your registration will require admin approval before you can access the system.
          </p>
        </div>
      )}
      
      {/* Admin Info Message for Login */}
      {mode === "login" && selectedRole === "Admin" && (
        <div className="flex items-start space-x-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
          <Info className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-amber-700">
            Use hardcoded admin credentials: admin@system.com / 1234
          </p>
        </div>
      )}
    </div>
  );
};

export default RoleSelector;