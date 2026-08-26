"use client";

import { useState, createContext, useContext, type ReactNode } from "react"
import Alert from "../components/Alert";

interface AlertItem {
  id: number;
  type: string;
  message: string;
  duration: number;
}

interface AlertContextValue {
  alerts: AlertItem[];
  showAlert: (type: string, message: string, duration?: number) => number;
  showSuccess: (message: string, duration?: number) => number;
  showError: (message: string, duration?: number) => number;
  showWarning: (message: string, duration?: number) => number;
  showInfo: (message: string, duration?: number) => number;
  removeAlert: (id: number) => void;
}

const AlertContext = createContext<AlertContextValue | null>(null);

export function useAlert() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
}

export function AlertProvider({ children }: { children: ReactNode }) {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);

  const showAlert = (type: string, message: string, duration = 4000) => {
    const id = Date.now();
    const newAlert = { id, type, message, duration };
    setAlerts(prev => [...prev, newAlert]);
    return id;
  };

  const removeAlert = (id: number) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  const showSuccess = (message: string, duration?: number) => showAlert('success', message, duration);
  const showError = (message: string, duration?: number) => showAlert('error', message, duration);
  const showWarning = (message: string, duration?: number) => showAlert('warning', message, duration);
  const showInfo = (message: string, duration?: number) => showAlert('info', message, duration);

  const value: AlertContextValue = {
    alerts,
    showAlert,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeAlert
  };

  return (
    <AlertContext.Provider value={value}>
      {children}
      {alerts.map((alert) => (
        <Alert
          key={alert.id}
          type={alert.type}
          message={alert.message}
          duration={alert.duration}
          onClose={() => removeAlert(alert.id)}
        />
      ))}
    </AlertContext.Provider>
  );
}
