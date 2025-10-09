import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, CheckCircle, AlertCircle, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function NotificationPanel({ notifications }) {
  if (notifications.length === 0) return null;

  const getNotificationIcon = (type) => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "warning":
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Info className="w-4 h-4 text-blue-600" />;
    }
  };

  return (
    <Card className="shadow-lg border-0">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bell className="w-5 h-5 text-blue-600" />
          Notificações
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <AnimatePresence>
            {notifications.slice(0, 5).map((notification) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
              >
                {getNotificationIcon(notification.type)}
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-500">
                    {notification.time.toLocaleTimeString()}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}