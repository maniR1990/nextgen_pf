'use client';

import { useEffect, useRef, useState } from 'react';

export interface UseCountdownResult {
  secondsLeft: number;
  isActive: boolean;
  start: (seconds: number) => void;
}

/** Ticks a seconds counter down to 0 once started; use to gate retry actions (e.g. rate limits). */
export function useCountdown(): UseCountdownResult {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  function start(seconds: number) {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (seconds <= 0) {
      setSecondsLeft(0);
      return;
    }

    setSecondsLeft(Math.floor(seconds));
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  return { secondsLeft, isActive: secondsLeft > 0, start };
}
