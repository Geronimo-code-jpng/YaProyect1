import { useState, useEffect } from 'react';

export default function Alert({ type = 'success', message, duration = 4000, onClose }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        if (onClose) onClose();
      }, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const alertTypes = {
    success: {
      bg: 'bg-green-500',
      border: 'border-green-400',
      icon: 'fas fa-check-circle',
      textColor: 'text-white'
    },
    error: {
      bg: 'bg-red-500',
      border: 'border-red-400',
      icon: 'fas fa-exclamation-triangle',
      textColor: 'text-white'
    },
    warning: {
      bg: 'bg-yellow-500',
      border: 'border-yellow-400',
      icon: 'fas fa-exclamation-circle',
      textColor: 'text-white'
    },
    info: {
      bg: 'bg-blue-500',
      border: 'border-blue-400',
      icon: 'fas fa-info-circle',
      textColor: 'text-white'
    }
  };

  const styles = alertTypes[type] || alertTypes.success;

  return (
    <div
      className={`fixed top-5 right-5 ${styles.bg} ${styles.textColor} px-6 py-4 rounded-2xl shadow-2xl transform transition-all duration-300 z-[99999] flex items-center gap-3 font-bold border-2 ${styles.border} ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-[150%] opacity-0'
      }`}
    >
      <i className={`${styles.icon} text-2xl`}></i>
      <span className="flex-1">{message}</span>
      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(() => {
            if (onClose) onClose();
          }, 300);
        }}
        className="ml-2 text-white/80 hover:text-white text-2xl leading-none"
      >
        &times;
      </button>
    </div>
  );
}
