import { useEffect, useState } from "react";

// Custom hook that combines useState with localStorage persistence, accepting a key and initial value
export const useStateLocalStorage = <T>(key: string, initialValue: T) => {
  // Initialize state with a function to handle hydration and localStorage retrieval
  const [state, setState] = useState<T>(() => {
    // Check if code is running on server-side, return initial value if so
    if (typeof window === 'undefined') return initialValue;
    // Try to get existing value from localStorage using provided key
    const item = localStorage.getItem(key);
    // If item exists in localStorage, parse and return it, otherwise use initial value
    return item ? JSON.parse(item) : initialValue;
  });

  // Effect hook to sync state changes to localStorage
  useEffect(() => {
    // Save current state to localStorage whenever state or key changes
    localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);

  // Return state and setState as a tuple with const assertion for proper typing
  return [state, setState] as const;
};
    