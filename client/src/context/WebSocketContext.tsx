import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext.js';
import { useToast } from './ToastContext.js';

interface WebSocketContextType {
  isConnected: boolean;
  lastEvent: any;
  refreshTrigger: number;
}

const WebSocketContext = createContext<WebSocketContextType>({
  isConnected: false,
  lastEvent: null,
  refreshTrigger: 0
});

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, user } = useAuth();
  const { info, warning, success } = useToast();
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lastEvent, setLastEvent] = useState<any>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!token) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setIsConnected(false);
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws?token=${token}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setLastEvent(data);

        // Don't show toast to the user who made the action themselves
        const isFromOtherPartner = data.payload?.actorName && data.payload?.actorName !== user?.full_name;

        if (data.type === 'NEW_NOTIFICATION' && isFromOtherPartner) {
          if (data.payload.type === 'WARNING' || data.payload.type === 'ALERT') {
            warning(data.payload.title, data.payload.message);
          } else {
            info(data.payload.title, data.payload.message);
          }
        } else if (data.type === 'AUDIT_LOG_ADDED' && isFromOtherPartner) {
          info(
            `Live Update: ${data.payload.actorName}`,
            `${data.payload.action} on ${data.payload.entityType}: ${data.payload.entityReference || ''}`
          );
        }

        // Trigger data re-fetch across the UI
        setRefreshTrigger(prev => prev + 1);
      } catch (err) {
        console.error('Error handling WebSocket message:', err);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    ws.onerror = () => {
      setIsConnected(false);
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [token, user?.full_name, info, warning]);

  return (
    <WebSocketContext.Provider value={{ isConnected, lastEvent, refreshTrigger }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => useContext(WebSocketContext);
