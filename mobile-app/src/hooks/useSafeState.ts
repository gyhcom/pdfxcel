/**
 * 안전한 상태 업데이트 훅
 * 컴포넌트가 언마운트된 후 상태 업데이트 시도를 방지
 */

import { useEffect, useRef, useState, useCallback } from 'react';

export function useSafeState<T>(initialState: T): [T, (newState: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(initialState);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const safeSetState = useCallback((newState: T | ((prev: T) => T)) => {
    if (isMountedRef.current) {
      setState(newState);
    } else {
      console.warn('Attempted to set state on unmounted component');
    }
  }, []);

  return [state, safeSetState];
}

export function useSafeAsync<T>() {
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const safeExecute = useCallback(async (asyncFunction: () => Promise<T>): Promise<T | null> => {
    try {
      const result = await asyncFunction();
      
      if (isMountedRef.current) {
        return result;
      } else {
        console.warn('Async operation completed after component unmount');
        return null;
      }
    } catch (error) {
      if (isMountedRef.current) {
        throw error;
      } else {
        console.warn('Async operation failed after component unmount:', error);
        return null;
      }
    }
  }, []);

  return { safeExecute, isMounted: () => isMountedRef.current };
}

export default useSafeState;