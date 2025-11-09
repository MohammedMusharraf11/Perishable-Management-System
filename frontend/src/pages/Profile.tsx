import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { User, Mail, Shield, Key, LogOut, Save } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const Profile = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handlePasswordChange = () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords don't match",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Password Updated",
      description: "Your password has been changed successfully",
    });

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <Layout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold text-primary dark:text-primary">
            Profile Settings
          </h1>
          <p className="text-muted-foreground">Manage your account and preferences</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="glass md:col-span-1">
              <CardContent className="p-6 text-center space-y-4">
                <Avatar className="h-24 w-24 mx-auto border-4 border-primary shadow-glow">
                  <AvatarFallback className="text-2xl font-bold gradient-primary text-white">
                    {user?.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>

                <div>
                  <h2 className="text-xl font-bold text-foreground">{user?.name}</h2>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>

                <Badge className="bg-primary text-primary-foreground">
                  {user?.role}
                </Badge>

                <div className="pt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Theme</span>
                    <ThemeToggle />
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full gap-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  onClick={logout}
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Settings Cards */}
          <div className="md:col-span-2 space-y-6">
            {/* Account Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    Account Information
                  </CardTitle>
                  <CardDescription>Update your personal details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      defaultValue={user?.name}
                      className="glass"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      defaultValue={user?.email}
                      className="glass"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Input
                      id="role"
                      value={user?.role}
                      disabled
                      className="glass"
                    />
                  </div>

                  <Button className="w-full gap-2 gradient-primary shadow-glow">
                    <Save className="h-4 w-4" />
                    Save Changes
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Change Password */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5 text-primary" />
                    Change Password
                  </CardTitle>
                  <CardDescription>Update your password to keep your account secure</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input
                      id="current-password"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="glass"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="glass"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="glass"
                    />
                  </div>

                  <Button
                    className="w-full gap-2 gradient-primary shadow-glow"
                    onClick={handlePasswordChange}
                  >
                    <Key className="h-4 w-4" />
                    Update Password
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Security Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="glass border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Security
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between p-3 glass rounded-lg">
                    <span className="text-sm text-foreground">Last Login</span>
                    <span className="text-sm font-medium text-muted-foreground">Today, 09:15 AM</span>
                  </div>
                  <div className="flex items-center justify-between p-3 glass rounded-lg">
                    <span className="text-sm text-foreground">Session Timeout</span>
                    <Badge variant="outline">30 minutes</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 glass rounded-lg">
                    <span className="text-sm text-foreground">Account Status</span>
                    <Badge className="bg-success text-success-foreground">Active</Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
