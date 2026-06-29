import { useEffect, useRef, useState } from 'react';

/**
 * Custom hook to establish a live connection to the Tablé WebSocket server matrix
 */
export function useMerchantSocket(restaurantId, { onBookingUpdate, onTableStateUpdate }) {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  useEffect(() => {
    if (!restaurantId) return;

    function connect() {
      // Establish path dynamically; falls back to window secure protocols in production environments
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host || 'localhost:5000';
      const wsUrl = `${protocol}//${host}/api/v1/ws/merchants?restaurantId=${restaurantId}`;

      console.log(`🔌 Initializing WebSocket transport channel to: ${wsUrl}`);
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        console.log('✅ WebSocket channel successfully secured.');
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const frame = JSON.parse(event.data);
          console.log('📥 Live message vector intercepted:', frame);

          switch (frame.type) {
            case 'BOOKING_CREATED':
            case 'BOOKING_UPDATED':
            case 'ETA_CHANGED':
              if (onBookingUpdate) onBookingUpdate(frame.payload);
              break;
            case 'TABLE_STATUS_CHANGED':
              if (onTableStateUpdate) onTableStateUpdate(frame.payload);
              break;
            default:
              console.warn('Unknown structural frame context intercepted:', frame.type);
          }
        } catch (err) {
          console.error('Failed to parse WebSocket downstream packet:', err);
        }
      };

      ws.onclose = (e) => {
        setIsConnected(false);
        console.warn(`❌ WebSocket connection lost (${e.reason || 'No clear diagnostic flag'}). Attempting automatic frame restoration in 5s...`);
        reconnectTimeoutRef.current = setTimeout(connect, 5000);
      };

      ws.onerror = (err) => {
        console.error('WebSocket communication cluster fault detected:', err);
        ws.close();
      };
    }

    connect();

    // Clean up channel links on unmount
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (socketRef.current) {
        socketRef.current.onclose = null; // Prevent firing state triggers on manual teardown
        socketRef.current.close();
      }
    };
  }, [restaurantId]);

  /**
   * Dispatches client-side layout adjustments back across the data network stream
   */
  const emitMessage = (type, payload) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type, payload }));
    } else {
      console.error('Transmission fault: WebSocket layer is currently detached.');
    }
  };

  return { isConnected, emitMessage };
}