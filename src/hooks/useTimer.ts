import { useState, useEffect } from 'react';

const TIMER_CHECK_INTERVAL = 100; // Check every 100ms for better accuracy

export function useTimer(matchId: string) {
  const getStoredState = () => {
    const stored = localStorage.getItem(`match-${matchId}-timer`);
    if (!stored) return null;
    return JSON.parse(stored);
  };

  const calculateCurrentTime = () => {
    const stored = getStoredState();
    if (!stored) return 0;

    const { time, lastUpdate, isRunning } = stored;
    if (!isRunning) return time;

    const elapsed = Math.floor((Date.now() - lastUpdate) / 1000);
    return time + elapsed;
  };

  const [time, setTime] = useState(calculateCurrentTime);
  const [isRunning, setIsRunning] = useState(() => {
    const stored = getStoredState();
    return stored ? stored.isRunning : false;
  });

  const saveState = (newTime: number, running: boolean) => {
    localStorage.setItem(`match-${matchId}-timer`, JSON.stringify({
      time: newTime,
      isRunning: running,
      lastUpdate: Date.now()
    }));
  };

  // Sync with localStorage
  useEffect(() => {
    const syncTimer = () => {
      if (isRunning) {
        const currentTime = calculateCurrentTime();
        setTime(currentTime);
      }
    };

    // Check for updates more frequently than the display interval
    const intervalId = setInterval(syncTimer, TIMER_CHECK_INTERVAL);

    // Initial sync
    syncTimer();

    return () => clearInterval(intervalId);
  }, [isRunning, matchId]);

  const toggleTimer = () => {
    const newIsRunning = !isRunning;
    const currentTime = calculateCurrentTime();
    
    setIsRunning(newIsRunning);
    setTime(currentTime);
    saveState(currentTime, newIsRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTime(0);
    saveState(0, false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    time,
    isRunning,
    toggleTimer,
    resetTimer,
    formatTime
  };
}