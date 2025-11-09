import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Loader2, CheckCircle, AlertCircle, Send } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export const EmailNotificationTrigger = () => {
  const [sending, setSending] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  const sendEmailNotifications = async () => {
    setSending(true);
    setLastResult(null);

    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_BASE}/api/cron/email-notification/run`);
      const data = await response.json();

      if (data.success && data.result?.success) {
        setLastResult(data.result);
        toast.success("Email notifications sent successfully!", {
          description: `Sent to ${data.result.stats?.emailsSent || 0} manager(s)`,
        });
      } else {
        toast.error("Failed to send email notifications", {
          description: data.result?.message || "Please check server logs",
        });
      }
    } catch (error) {
      console.error("Error sending emails:", error);
      toast.error("Failed to send email notifications", {
        description: "Could not connect to server",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="glass border-2 border-primary/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary" />
          Email Notifications
        </CardTitle>
        <CardDescription>
          Send expiry alerts to all managers immediately
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Button
            onClick={sendEmailNotifications}
            disabled={sending}
            className="gap-2"
            size="lg"
          >
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending Emails...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send Email Notifications
              </>
            )}
          </Button>

          {lastResult && !sending && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 text-sm"
            >
              <CheckCircle className="h-4 w-4 text-success" />
              <span className="text-success font-medium">
                Sent to {lastResult.stats?.emailsSent || 0} manager(s)
              </span>
            </motion.div>
          )}
        </div>

        <AnimatePresence>
          {lastResult && !sending && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-accent/30 rounded-lg p-4 border border-border/50"
            >
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" />
                Last Send Summary
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Total Managers</p>
                  <p className="font-semibold">{lastResult.stats?.totalManagers || 0}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Emails Sent</p>
                  <p className="font-semibold text-success">
                    {lastResult.stats?.emailsSent || 0}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Failed</p>
                  <p className="font-semibold text-destructive">
                    {lastResult.stats?.emailsFailed || 0}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Duration</p>
                  <p className="font-semibold">{lastResult.duration || 0}s</p>
                </div>
              </div>

              {lastResult.stats?.errors && lastResult.stats.errors.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border/50">
                  <p className="text-xs text-destructive font-medium mb-1">
                    Failed Emails:
                  </p>
                  {lastResult.stats.errors.map((err: any, i: number) => (
                    <p key={i} className="text-xs text-muted-foreground">
                      • {err.manager}: {err.error}
                    </p>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
          <div className="flex gap-2">
            <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">Automatic Schedule</p>
              <p>
                Emails are automatically sent daily at 6:30 AM to all active managers.
                Use this button to send immediately if needed.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
