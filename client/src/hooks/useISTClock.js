import { useEffect, useState } from 'react';

const formatIST = () =>
  new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'medium',
    hour12: false,
  }).format(new Date());

export const useISTClock = () => {
  const [istTime, setIstTime] = useState(formatIST);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setIstTime(formatIST());
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  return istTime;
};
