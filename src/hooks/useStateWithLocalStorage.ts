import { useEffect, useState } from "react";

export const useStateLocalStorage = <T>(key: string, initialValue: T) => {
  const [state, setState] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : initialValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);

  return [state, setState] as const;
};
    