"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, AlertTriangle } from "lucide-react";

// Configuration
const SESSION_CHECK_INTERVAL = 60 * 1000; // Check every 1 minute
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes of inactivity
const WARNING_BEFORE_TIMEOUT = 5 * 60 * 1000; // Show warning 5 minutes before timeout

export function SessionTimeoutHandler() {
  const { user, logout, refresh } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const lastActivityRef = useRef<number>(Date.now());
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const logoutTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Extend session
  const extendSession = useCallback(async () => {
    setShowWarning(false);
    lastActivityRef.current = Date.now();
    
    // Clear existing timeouts
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    if (logoutTimeoutRef.current) clearTimeout(logoutTimeoutRef.current);
    
    // Refresh session on server
    try {
      await fetch("/api/auth/me", { 
        method: "GET",
        cache: "no-store",
      });
    } catch (error) {
      console.error("Failed to refresh session:", error);
    }
  }, []);

  // Update last activity time on user interaction
  const updateActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    // If warning is showing and user is active, extend session
    if (showWarning) {
      extendSession();
    }
  }, [showWarning, extendSession]);

  // Handle session timeout
  const handleTimeout = useCallback(async () => {
    setShowWarning(false);
    await logout();
  }, [logout]);

  // Check for inactivity
  useEffect(() => {
    if (!user) return;

    // Capture ref values for cleanup
    const warningTimeout = warningTimeoutRef;
    const logoutTimeout = logoutTimeoutRef;

    const checkInactivity = () => {
      const now = Date.now();
      const timeSinceActivity = now - lastActivityRef.current;
      const timeUntilTimeout = INACTIVITY_TIMEOUT - timeSinceActivity;

      if (timeUntilTimeout <= 0) {
        // Session timed out due to inactivity
        handleTimeout();
      } else if (timeUntilTimeout <= WARNING_BEFORE_TIMEOUT && !showWarning) {
        // Show warning
        setShowWarning(true);
        setTimeRemaining(Math.ceil(timeUntilTimeout / 1000));
        
        // Set logout timeout
        logoutTimeout.current = setTimeout(() => {
          handleTimeout();
        }, timeUntilTimeout);
      }
    };

    // Initial check
    checkInactivity();

    // Set up interval for checking
    const intervalId = setInterval(checkInactivity, SESSION_CHECK_INTERVAL);

    // Set up activity listeners
    const events = ["mousedown", "keydown", "scroll", "touchstart", "mousemove"];
    
    // Throttle activity updates to prevent excessive calls
    let throttleTimeout: NodeJS.Timeout | null = null;
    const throttledUpdateActivity = () => {
      if (!throttleTimeout) {
        updateActivity();
        throttleTimeout = setTimeout(() => {
          throttleTimeout = null;
        }, 5000); // Throttle to once per 5 seconds
      }
    };

    events.forEach((event) => {
      window.addEventListener(event, throttledUpdateActivity, { passive: true });
    });

    return () => {
      clearInterval(intervalId);
      if (warningTimeout.current) clearTimeout(warningTimeout.current);
      if (logoutTimeout.current) clearTimeout(logoutTimeout.current);
      if (throttleTimeout) clearTimeout(throttleTimeout);
      events.forEach((event) => {
        window.removeEventListener(event, throttledUpdateActivity);
      });
    };
  }, [user, showWarning, updateActivity, handleTimeout]);

  // Countdown timer for warning modal
  useEffect(() => {
    if (!showWarning || timeRemaining <= 0) return;

    const countdownInterval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [showWarning, timeRemaining]);

  // Format time remaining
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!showWarning || !user) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <Card className="w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
        <CardContent className="p-6">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 mb-4">
              <AlertTriangle className="h-8 w-8 text-amber-600" />
            </div>
            
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Session Timeout Warning
            </h2>
            
            <p className="text-gray-600 mb-4">
              Your session is about to expire due to inactivity.
            </p>
            
            <div className="flex items-center gap-2 text-3xl font-bold text-amber-600 mb-6">
              <Clock className="h-8 w-8" />
              <span>{formatTime(timeRemaining)}</span>
            </div>
            
            <p className="text-sm text-gray-500 mb-6">
              Click &quot;Stay Logged In&quot; to continue your session, or you will be automatically logged out.
            </p>
            
            <div className="flex gap-3 w-full">
              <Button
                onClick={extendSession}
                className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
              >
                Stay Logged In
              </Button>
              <Button
                variant="outline"
                onClick={handleTimeout}
                className="flex-1"
              >
                Logout Now
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
