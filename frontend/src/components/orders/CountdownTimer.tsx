import { useState, useEffect, useRef, useCallback } from "react"

interface CountdownTimerProps {
  expira_en: string;
  onExpire: () => void;
}

export default function CountdownTimer({ expira_en, onExpire }: CountdownTimerProps) {
  const calculateTimeLeft = useCallback(() => {
    const difference = new Date(expira_en).getTime() - Date.now();
    if (difference > 0) {
      return {
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }
    return null;
  }, [expira_en]);

  const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft());
  const prevTimeLeftRef = useRef(timeLeft);

  useEffect(() => {
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);

      if (newTimeLeft === null && prevTimeLeftRef.current !== null) {
        onExpire();
      }

      prevTimeLeftRef.current = newTimeLeft;
    }, 1000);

    return () => clearInterval(timer);
  }, [expira_en, onExpire, calculateTimeLeft]);

  if (!timeLeft) {
    return <span className="text-red-600 font-bold">Tiempo vencido</span>;
  }

  return (
    <span className="text-blue-600 font-bold">
      {timeLeft.minutes}:{timeLeft.seconds.toString().padStart(2, "0")} para pagar
    </span>
  );
}
