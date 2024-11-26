import { useState, useEffect } from "react";

interface DebounceOptions {
  delay?: number;
  maxWait?: number;
  leading?: boolean;
}

export const useDebounce = <T>(value: T, options: DebounceOptions = {}): T => {
  // Default options
  const { delay = 500, maxWait = delay * 3, leading = false } = options;

  // Skip debouncing on server-side

  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Handle initial leading edge call
    if (leading && value !== debouncedValue) {
      setDebouncedValue(value);
    }

    let maxWaitTimeoutId: NodeJS.Timeout;
    let lastInvokeTime = Date.now();

    const invokeChange = () => {
      clearTimeout(maxWaitTimeoutId);
      setDebouncedValue(value);
      lastInvokeTime = Date.now();
    };

    // Set up main debounce timeout
    const timeoutId = setTimeout(invokeChange, delay);

    // Set up max wait timeout if specified
    if (maxWait > 0) {
      maxWaitTimeoutId = setTimeout(() => {
        if (Date.now() - lastInvokeTime >= maxWait) {
          invokeChange();
        }
      }, maxWait);
    }

    // Cleanup function
    return () => {
      clearTimeout(timeoutId);
      if (maxWaitTimeoutId) {
        clearTimeout(maxWaitTimeoutId);
      }
    };
  }, [value, delay, maxWait, leading, debouncedValue]);

  return debouncedValue;
};
