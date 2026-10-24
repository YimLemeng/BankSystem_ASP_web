import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { loadingEvent } from '../services/loadingEvent';

const LoadingContext = createContext({
  isLoading: false,
  message: 'Loading data...',
  subtitle: 'Please wait while the request is processing.',
  showLoading: () => {},
  hideLoading: () => {},
  forceHide: () => {},
});

export const LoadingProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('Loading data...');
  const [subtitle, setSubtitle] = useState('Please wait while the request is processing.');
  const requestCount = useRef(0);
  const lockedUntil = useRef(0);
  const autoHideTimer = useRef(null);

  const hideLoading = useCallback(() => {
    requestCount.current = Math.max(0, requestCount.current - 1);
    if (requestCount.current === 0) {
      setTimeout(() => {
        if (requestCount.current === 0) {
          setIsLoading(false);
          lockedUntil.current = 0;
        }
      }, 150);
    }
  }, []);

  const showLoading = useCallback((msg = 'Loading data...', sub = 'Please wait while the request is processing.', lockDurationMs = 450) => {
    requestCount.current += 1;
    setMessage(msg);
    setSubtitle(sub);
    setIsLoading(true);

    if (lockDurationMs > 0) {
      lockedUntil.current = Date.now() + lockDurationMs;
      if (autoHideTimer.current) clearTimeout(autoHideTimer.current);
      autoHideTimer.current = setTimeout(() => {
        hideLoading();
      }, lockDurationMs);
    }
  }, [hideLoading]);

  const forceHide = useCallback(() => {
    requestCount.current = 0;
    lockedUntil.current = 0;
    if (autoHideTimer.current) clearTimeout(autoHideTimer.current);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const unsubscribe = loadingEvent.subscribe((type, payload) => {
      if (type === 'start') {
        requestCount.current += 1;
        // Only update message if not currently locked by an explicit user action / route transition
        const isLocked = Date.now() < lockedUntil.current;
        if (!isLocked && payload?.message) {
          setMessage(payload.message);
          setSubtitle(payload?.subtitle || 'Please wait while the request is processing.');
        }
        setIsLoading(true);
      } else if (type === 'end') {
        hideLoading();
      }
    });

    return unsubscribe;
  }, [hideLoading]);

  return (
    <LoadingContext.Provider
      value={{
        isLoading,
        message,
        subtitle,
        showLoading,
        hideLoading,
        forceHide,
      }}
    >
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => useContext(LoadingContext);
