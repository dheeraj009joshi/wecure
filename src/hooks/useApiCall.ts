import { useState, useCallback, useRef, useEffect } from 'react';

interface UseApiCallOptions<T> {
  immediate?: boolean;
  timeout?: number;
  onSuccess?: (data: T) => void;
  onError?: (error: any) => void;
}

interface UseApiCallReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: () => Promise<void>;
  reset: () => void;
}

/**
 * Generic hook for API calls with proper loading and error handling
 * Ensures loading state is ALWAYS cleared, even on errors or timeouts
 */
export function useApiCall<T>(
  apiFunction: () => Promise<T>,
  options: UseApiCallOptions<T> = {}
): UseApiCallReturn<T> {
  const {
    immediate = true,
    timeout = 10000, // 10 seconds default
    onSuccess,
    onError,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState<string | null>(null);
  
  const isMountedRef = useRef(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isExecutingRef = useRef(false);
  const apiFunctionRef = useRef(apiFunction);
  
  // Update ref when apiFunction changes
  useEffect(() => {
    apiFunctionRef.current = apiFunction;
  }, [apiFunction]);

  const execute = useCallback(async () => {
    // Prevent concurrent calls
    if (isExecutingRef.current) {
      console.log('[useApiCall] Already executing, skipping...');
      return;
    }

    console.log('[useApiCall] Starting API call...');
    isExecutingRef.current = true;
    setLoading(true);
    setError(null);

    // Set up timeout
    timeoutRef.current = setTimeout(() => {
      if (isMountedRef.current && isExecutingRef.current) {
        console.warn('[useApiCall] Timeout - clearing loading state');
        setLoading(false);
        setError('Request timed out. Please try again.');
        isExecutingRef.current = false;
        
        if (onError) {
          onError(new Error('Request timeout'));
        }
      }
    }, timeout);

    try {
      console.log('[useApiCall] Calling API function...');
      const result = await apiFunctionRef.current();
      console.log('[useApiCall] API call successful, result:', result ? 'has data' : 'empty');
      
      // Clear timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      if (!isMountedRef.current) {
        console.log('[useApiCall] Component unmounted, ignoring result');
        isExecutingRef.current = false;
        return;
      }

      // Always clear loading - THIS IS CRITICAL
      console.log('[useApiCall] Clearing loading state...');
      setLoading(false);
      isExecutingRef.current = false;
      
      // Handle response - even empty arrays are valid
      if (result !== null && result !== undefined) {
        console.log('[useApiCall] Setting data');
        setData(result);
        if (onSuccess) {
          onSuccess(result);
        }
      } else {
        console.warn('[useApiCall] Empty response received');
        setData(null);
      }
    } catch (err: any) {
      console.error('[useApiCall] API call failed:', err);
      
      // Clear timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      if (!isMountedRef.current) {
        console.log('[useApiCall] Component unmounted, ignoring error');
        isExecutingRef.current = false;
        return;
      }

      // Always clear loading on error - THIS IS CRITICAL
      console.log('[useApiCall] Clearing loading state after error');
      setLoading(false);
      isExecutingRef.current = false;

      const errorMessage = 
        err.response?.data?.detail || 
        err.message || 
        'An error occurred. Please try again.';
      
      setError(errorMessage);
      
      if (onError) {
        onError(err);
      }
    }
  }, [apiFunction, timeout, onSuccess, onError]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
    isExecutingRef.current = false;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Execute immediately if requested
  useEffect(() => {
    isMountedRef.current = true;
    
    if (immediate) {
      console.log('[useApiCall] Immediate execution requested');
      execute();
    } else {
      console.log('[useApiCall] Immediate execution disabled, setting loading to false');
      setLoading(false);
    }

    return () => {
      console.log('[useApiCall] Cleanup: unmounting');
      isMountedRef.current = false;
      isExecutingRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [immediate]); // Only depend on immediate, execute is stable via ref

  return {
    data,
    loading,
    error,
    execute,
    reset,
  };
}
