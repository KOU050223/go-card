/**
 * WebSocket hook for real-time communication with the game server
 * Handles connection, reconnection with exponential backoff, and message handling
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { useGameStore } from '../store/game';
import { useAuth } from '../contexts/AuthContext';

interface UseSocketOptions {
  url?: string;
  maxReconnectAttempts?: number;
  maxReconnectDelay?: number;
}

interface SocketMessage {
  type: string;
  [key: string]: any;
}

/**
 * Custom hook for WebSocket connection management
 * @param options - Configuration options for the WebSocket connection
 * @returns Socket connection utilities and state
 */
export const useSocket = (options: UseSocketOptions = {}) => {
  const {
    url = import.meta.env.VITE_BACKEND_WS || 'ws://localhost:8080/ws',
    maxReconnectAttempts = 5,
    maxReconnectDelay = 30000, // 30 seconds
  } = options;

  const { user } = useAuth();
  const { 
    setConnectionStatus, 
    setPlayer, 
    setOpponent, 
    setHand, 
    setIsMyTurn, 
    setGameStatus, 
    setWinner, 
    updatePlayerHp, 
    updateOpponentHp 
  } = useGameStore();

  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const isManualCloseRef = useRef(false);

  /**
   * Calculate exponential backoff delay
   */
  const getReconnectDelay = useCallback(() => {
    const baseDelay = 1000; // 1 second
    const delay = Math.min(baseDelay * Math.pow(2, reconnectAttemptsRef.current), maxReconnectDelay);
    return delay + Math.random() * 1000; // Add jitter
  }, [maxReconnectDelay]);

  /**
   * Send message through WebSocket
   */
  const sendMessage = useCallback((message: SocketMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected. Message not sent:', message);
    }
  }, []);

  /**
   * Handle incoming WebSocket messages
   */
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const message: SocketMessage = JSON.parse(event.data);
      
      switch (message.type) {
        case 'pong':
          // Handle pong response
          break;
          
        case 'gameUpdate':
          if (message.player) setPlayer(message.player);
          if (message.opponent) setOpponent(message.opponent);
          if (message.hand) setHand(message.hand);
          if (typeof message.isMyTurn === 'boolean') setIsMyTurn(message.isMyTurn);
          if (message.gameStatus) setGameStatus(message.gameStatus);
          break;
          
        case 'hpUpdate':
          if (message.playerHp !== undefined) updatePlayerHp(message.playerHp);
          if (message.opponentHp !== undefined) updateOpponentHp(message.opponentHp);
          break;
          
        case 'gameEnd':
          setGameStatus('finished');
          if (message.winner) setWinner(message.winner);
          break;

        case 'roomJoined':
          console.log('Joined room:', message.content);
          // ルーム参加の状態を更新
          break;

        case 'gameReady':
          console.log('Game ready:', message.content);
          // ゲーム準備完了の処理
          break;

        case 'gameStart':
          console.log('Game starting:', message.content);
          setGameStatus('playing');
          // ゲーム開始時の処理
          break;

        case 'matchCancelled':
          console.log('Match cancelled');
          // マッチキャンセル時の処理
          break;
          
        case 'error':
          console.error('Server error:', message.message || message.content?.message);
          setConnectionStatus(false, message.message || message.content?.message);
          break;
          
        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }, [setPlayer, setOpponent, setHand, setIsMyTurn, setGameStatus, setWinner, updatePlayerHp, updateOpponentHp, setConnectionStatus]);

  /**
   * Start ping interval to keep connection alive
   */
  const startPing = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
    }
    
    pingIntervalRef.current = setInterval(() => {
      sendMessage({ type: 'ping' });
    }, 30000); // 30 seconds
  }, [sendMessage]);

  /**
   * Stop ping interval
   */
  const stopPing = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
  }, []);

  /**
   * Connect to WebSocket server
   */
  const connect = useCallback(async () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const token = user ? await user.getIdToken() : '';
      const wsUrl = token ? `${url}?token=${encodeURIComponent(token)}` : url;
      
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setConnectionStatus(true);
        reconnectAttemptsRef.current = 0;
        startPing();
      };

      wsRef.current.onmessage = handleMessage;

      wsRef.current.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        setConnectionStatus(false);
        stopPing();

        // Reconnect if not manually closed
        if (!isManualCloseRef.current && reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = getReconnectDelay();
          console.log(`Reconnecting in ${delay}ms... (attempt ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connect();
          }, delay);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus(false, 'Connection error');
      };

    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      setConnectionStatus(false, 'Failed to connect');
    }
  }, [url, user, handleMessage, startPing, stopPing, maxReconnectAttempts, getReconnectDelay, setConnectionStatus]);

  /**
   * Disconnect from WebSocket server
   */
  const disconnect = useCallback(() => {
    isManualCloseRef.current = true;
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    stopPing();
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setConnectionStatus(false);
  }, [stopPing, setConnectionStatus]);

  /**
   * Manually trigger reconnection
   */
  const reconnect = useCallback(() => {
    disconnect();
    isManualCloseRef.current = false;
    reconnectAttemptsRef.current = 0;
    setTimeout(() => connect(), 100);
  }, [disconnect, connect]);

  // Auto-connect when user is available
  useEffect(() => {
    if (user) {
      isManualCloseRef.current = false;
      connect();
    } else {
      disconnect();
    }

    return () => {
      isManualCloseRef.current = true;
      disconnect();
    };
  }, [user, connect, disconnect]);

  return {
    isConnected,
    sendMessage,
    connect,
    disconnect,
    reconnect,
  };
};
