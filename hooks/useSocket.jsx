import { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';

// Create a module-level variable to prevent repeated connection attempts across rerenders
let connectionAttempted = false;

export const useSocket = () => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 1; // Just try once

  useEffect(() => {
    // Don't try to connect if we've already hit the max retries
    // or if we've already attempted a connection in this session
    if (retryCount >= MAX_RETRIES || connectionAttempted) {
      return;
    }

    // Mark that we've attempted a connection
    connectionAttempted = true;

    try {
      // Create socket connection with error handling
      const socketInstance = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
        reconnectionAttempts: 1, // Only try to reconnect once
        timeout: 3000, // Shorter timeout
        autoConnect: true,
        transports: ['websocket', 'polling']
      });

      setSocket(socketInstance);

      // Handle connection events
      socketInstance.on('connect', () => {
        console.log('🔌 Socket connected');
        setConnected(true);
        setError(null);
      });

      socketInstance.on('disconnect', (reason) => {
        console.log(`🔌 Socket disconnected: ${reason}`);
        setConnected(false);
        
        // If we disconnect after being connected, don't try to reconnect automatically
        // This prevents repeated reconnection attempts in the console
        if (connected) {
          socketInstance.disconnect();
        }
      });

      socketInstance.on('connect_error', (err) => {
        console.log('🔌 Socket connection error - switching to offline mode');
        setError(err);
        setConnected(false);
        
        // Immediately stop trying to connect to prevent console spam
        socketInstance.disconnect();
        setRetryCount(MAX_RETRIES); // Ensure we don't try again
      });

      socketInstance.on('notification', (notification) => {
        setNotifications((prev) => [notification, ...prev]);
      });

      // Clean up function
      return () => {
        if (socketInstance) {
          socketInstance.disconnect();
        }
      };
    } catch (err) {
      console.error('🔌 Error initializing socket connection - switching to offline mode');
      setError(err);
      setRetryCount(MAX_RETRIES); // Ensure we don't try again
    }
  }, [retryCount, connected]);

  // Add a notification manually (useful when socket is unavailable)
  const addNotification = useCallback((message, type = 'info') => {
    const notification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date()
    };
    
    setNotifications(prev => [notification, ...prev]);
    
    // If socket is connected, try to broadcast the notification
    if (socket && connected) {
      try {
        socket.emit('notification', notification);
      } catch (err) {
        console.error('Failed to emit notification via socket:', err);
      }
    }
    
    return notification;
  }, [socket, connected]);

  // Clear notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    socket,
    connected,
    notifications,
    addNotification,
    clearNotifications,
    error
  };
};