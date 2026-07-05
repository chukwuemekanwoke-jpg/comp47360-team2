import { useState, useEffect, useRef } from 'react';

export function useMerchantSocket(restaurantId, { onBookingUpdate, onTableStateUpdate }) {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  useEffect(() => {
    if (!restaurantId) return;

    function connect() {
      // Pulling the correct authorization token
      const token = localStorage.getItem('table_merchant_token');
      
      // FIXED: Pointing directly to the backend port 3001 instead of Vite port 5173
      const wsUrl = `ws://localhost:3001/api/v1/ws/merchants?restaurantId=${restaurantId}&token=${token}`;
      
      console.log(`🔌 Initializing WebSocket transport channel to: ${wsUrl}`);
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('✅ WebSocket channel successfully secured.');
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'BOOKING_UPDATE' && onBookingUpdate) {
            onBookingUpdate(data.payload);
          } else if (data.type === 'TABLE_UPDATE' && onTableStateUpdate) {
            onTableStateUpdate(data.payload);
          }
        } catch (err) {
          console.error('WebSocket message parsing error:', err);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket communication cluster fault detected:', error);
      };

      ws.onclose = () => {
        setIsConnected(false);
        console.warn('❌ WebSocket connection lost. Attempting automatic frame restoration in 5s...');
        reconnectTimeoutRef.current = setTimeout(connect, 5000);
      };
    }

    connect();

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null; // Prevent reconnect loop on unmount
        wsRef.current.close();
      }
    };
  }, [restaurantId, onBookingUpdate, onTableStateUpdate]);

  return { isConnected };
}