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
  duelId?: string; // 追加
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
    maxReconnectDelay = 30000,
    duelId, 
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
    updateOpponentHp,
    setCurrentRoom,
    setSearchingMatch,
    setMatchmakingError,
    setDuelId
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
    console.log('=== SENDING MESSAGE ===');
    console.log('WebSocket readyState:', wsRef.current?.readyState);
    console.log('WebSocket.OPEN:', WebSocket.OPEN);
    console.log('WebSocket exists:', !!wsRef.current);
    console.log('Message:', message);
    
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log('Sending message:', message.type, message);
      wsRef.current.send(JSON.stringify(message));
      console.log('Message sent successfully');
    } else {
      console.warn('WebSocket is not connected. Message not sent:', message);
      console.warn('WebSocket state:', wsRef.current?.readyState);
      console.warn('Expected state (OPEN):', WebSocket.OPEN);
    }
  }, []);

  /**
   * Handle incoming WebSocket messages
   */
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const message: SocketMessage = JSON.parse(event.data);
      console.log('Received message:', message.type, message);
      
      switch (message.type) {
        case 'pong':
          // Handle pong response
          break;

        case 'user_connected':
          console.log('User connected:', message.userId || message.content);
          // ユーザー接続通知の処理（必要に応じて追加処理を実装）
          break;

        case 'testResponse':
          console.log('🎉 テストレスポンス受信:', message.content);
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
          setCurrentRoom(message.content);
          setSearchingMatch(true);
          break;

        case 'gameReady':
          console.log('Game ready:', message.content);
          setSearchingMatch(false);
          // ゲーム準備完了の処理
          break;

        case 'gameStart':
          console.log('Game starting:', message.content);
          setGameStatus('playing');
          setSearchingMatch(false);
          setCurrentRoom(null);
          // ゲーム開始時の処理 - 画面遷移はコンポーネント側で行う
          if (message.content) {
            // duelIdをstoreに保存
            if (message.content.duelId) setDuelId(message.content.duelId);
            // ゲーム開始に関する追加データがある場合の処理
            if (message.content.players) {
              const players = message.content.players;
              // プレイヤー情報を設定（現在のユーザーと対戦相手を区別）
              const isMe = (p: any) =>
                p.uid === user?.uid || p.userId === user?.uid || p.UserID === user?.uid;
              const currentPlayer = players.find(isMe);
              const opponent      = players.find((p: any) => !isMe(p));              if (currentPlayer) setPlayer(currentPlayer);
              if (opponent) setOpponent(opponent);
            }
          }
          break;

        case 'matchCancelled':
          console.log('Match cancelled');
          setSearchingMatch(false);
          setMatchmakingError('マッチングがキャンセルされました');
          setCurrentRoom(null);
          break;
          
        case 'error':
          console.error('Server error:', message.message || message.content?.message);
          setConnectionStatus(false, message.message || message.content?.message);
          break;
          
        case 'duelData': {
          console.log('Duel data received:', message.content);

          // --- 受信データの分割 ---
          const { players, status, turnCount, activeIdx, ...rest } =
            message.content || {};

          // --- プレイヤー／相手の判定関数（キー名の揺れを網羅） ---
          const isMe = (p: any) =>
            p.uid === user?.uid ||
            p.userId === user?.uid ||
            p.UserID === user?.uid ||
            p.user_id === user?.uid;

          if (players && user) {
            const currentPlayer = players.find(isMe);
            const rivalPlayer   = players.find((p: any) => !isMe(p));

            // 自分の情報を store へ
            if (currentPlayer) {
              setPlayer(currentPlayer);

              // 手札・ターン情報も反映（プロパティ名の大小両対応）
              const hand     = currentPlayer.hand ?? currentPlayer.Hand;
              const isMyTurn = currentPlayer.isMyTurn ?? currentPlayer.IsMyTurn;

              if (hand)            setHand(hand);
              if (isMyTurn !== undefined) setIsMyTurn(isMyTurn);
            }

            // 相手情報を store へ
            if (rivalPlayer) {
              setOpponent(rivalPlayer);
            }
          }

          // --- ゲーム全体のステータスを反映 ---
          if (status) {
            setGameStatus(status);   // 例: 'waiting' | 'playing' | 'finished'
          }

          // 必要なら追加情報（ターン数など）もここでセット
          // e.g. setTurnCount(turnCount);

          break;
        }
          
        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }, [setPlayer, setOpponent, setHand, setIsMyTurn, setGameStatus, setWinner, updatePlayerHp, updateOpponentHp, setConnectionStatus, setCurrentRoom, setSearchingMatch, setMatchmakingError, setDuelId]);

  /**
   * Start ping interval to keep connection alive
   */
  const startPing = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
    }
    
    pingIntervalRef.current = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        sendMessage({ type: 'ping' });
      }
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
    if (!url || !user) return;

    // すでに OPEN / CONNECTING のソケットがあるなら再利用
    if (wsRef.current &&
        (wsRef.current.readyState === WebSocket.OPEN ||
         wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    // Close existing connection if any
    if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
      console.log('Closing existing WebSocket connection before reconnecting');
      wsRef.current.close();
      wsRef.current = null;
    }

    try {
      const token = user ? await user.getIdToken() : '';
      const uid = user ? user.uid : '';
      
      // デバッグ: duelIdの値を出力
      console.log('connect: duelId', duelId);
      // UIDとトークンの両方をクエリパラメータで送信
      const params = new URLSearchParams();
      if (token) params.append('token', token);
      if (uid) params.append('uid', uid);
      if (duelId) params.append('duelId', duelId); // duelIdがある場合のみ追加
      const wsUrl = params.toString() ? `${url}?${params.toString()}` : url;
      console.log('Connecting to WebSocket:', wsUrl.replace(/token=[^&]+/, 'token=***'));
      
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('=== WEBSOCKET CONNECTED ===');
        console.log('WebSocket readyState:', wsRef.current?.readyState);
        console.log('duelId:', duelId, 'user:', user?.uid);
        setIsConnected(true);
        setConnectionStatus(true);
        reconnectAttemptsRef.current = 0;
        // Ping開始は接続が完全に確立された後に行う
        setTimeout(() => {
          startPing();
        }, 100);
      };

      wsRef.current.onmessage = handleMessage;

      wsRef.current.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason, 'wasClean:', event.wasClean);
        setIsConnected(false);
        setConnectionStatus(false);
        stopPing();
        wsRef.current = null;
        if (!isManualCloseRef.current && 
            !event.wasClean && 
            event.code !== 1000 && // Normal closure
            event.code !== 1001 && // Going away
            reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = getReconnectDelay();
          console.log(`Reconnecting in ${Math.round(delay)}ms...`);
          reconnectTimeoutRef.current = setTimeout(connect, delay);
          reconnectAttemptsRef.current++;
        }
      };

      wsRef.current.onerror = (event) => {
        console.error('WebSocket error:', event);
        setConnectionStatus(false, 'WebSocketエラー');
      };
    } catch (err) {
      console.error('WebSocket接続エラー:', err);
      setConnectionStatus(false, 'WebSocket接続エラー');
    }
  }, [url, user, duelId, maxReconnectAttempts, getReconnectDelay, setConnectionStatus, startPing, stopPing, handleMessage]);

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

  // Auto-connect when user, duelId, and url areすべて揃ったときだけ接続する
  useEffect(() => {
    if (user && duelId && url) {
      isManualCloseRef.current = false;
      connect();
    } else {
      disconnect();
    }
    // クリーンアップは「アンマウント時」だけ
    return () => {
      isManualCloseRef.current = true;
      disconnect();
    };
  }, [user, duelId, url]); // duelId依存を追加

  return {
    isConnected,
    sendMessage,
    connect,
    disconnect,
    reconnect,
  };
};
