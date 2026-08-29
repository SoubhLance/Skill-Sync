import { useState, useEffect } from 'react';

/**
  * Custom hook for debouncing fast-changing values (e.g. input keystrokes)
  * to prevent continuous re-rendering or expensive API calls.
  */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
