import { createContext, useContext, useState } from 'react';
import Alert from '../components/Alert';

const AlertContext = createContext();

export function useAlert() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
}

export function AlertProvider({ children }) {
  const [alerts, setAlerts] = useState([]);

  const showAlert = (type, message, duration = 4000) => {
    const id = Date.now();
    const newAlert = { id, type, message, duration };
    
    setAlerts(prev => [...prev, newAlert]);
    
    return id;
  };

  const removeAlert = (id) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  const showSuccess = (message, duration) => showAlert('success', message, duration);
  const showError = (message, duration) => showAlert('error', message, duration);
  const showWarning = (message, duration) => showAlert('warning', message, duration);
  const showInfo = (message, duration) => showAlert('info', message, duration);

  const value = {
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
      {/* Global Alerts */}
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
