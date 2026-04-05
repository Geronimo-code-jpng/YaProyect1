import { useState } from 'react';

export function useAlert() {
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

  return {
    alerts,
    showAlert,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeAlert
  };
}
