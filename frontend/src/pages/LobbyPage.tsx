/**
 * LobbyPage component for user authentication and matchmaking
 * Handles Google sign-in, email authentication and initiates game matchmaking
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../hooks/useSocket';
import { useGameStore } from '../store/game';
import { EmailAuthForm } from '../components/EmailAuthForm';
import { getAuth } from 'firebase/auth'; // 追加

/**
 * LobbyPage component that manages authentication and game matching
 */
export const LobbyPage: React.FC = () => {
  const { user, signInWithGoogle, logout } = useAuth();
  const { sendMessage, isConnected } = useSocket({ url: '/ws' });
  const { phase, isSearchingMatch, matchmakingError, setSearchingMatch, setMatchmakingError, setDuelId } = useGameStore();
  const navigate = useNavigate();
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<'google' | 'email'>('google');

  // WebSocket接続状態の監視
  useEffect(() => {
    console.log('=== LobbyPage: isConnected changed ===');
    console.log('isConnected:', isConnected);
    console.log('user:', user?.uid);
    console.log('sendMessage function:', typeof sendMessage);
  }, [isConnected, user, sendMessage]);

  // ゲーム開始時の画面遷移を監視
  useEffect(() => {
    if (phase === 'battle') {
      navigate('/duel');
    }
  }, [phase, navigate]);

  // マッチメイキングエラーの監視
  useEffect(() => {
    if (matchmakingError) {
      setSearchError(matchmakingError);
      setIsSearching(false);
    }
  }, [matchmakingError]);

  // マッチメイキング状態の同期
  useEffect(() => {
    setIsSearching(isSearchingMatch);
  }, [isSearchingMatch]);

  // マッチング状態ポーリング
  const pollMatchStatus = (idToken?: string) => {
    const interval = setInterval(async () => {
      try {
        const user = getAuth().currentUser;
        const token = idToken || (user ? await user.getIdToken() : null);
        const res = await fetch('/api/matchmaking/status', {
          credentials: 'include',
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        });
        const data = await res.json();
        console.log('pollMatchStatus data:', data); // ← 追加
        if (data.status === 'matched') {
          clearInterval(interval);
          if (data.duelId) {
            setDuelId(data.duelId);
            setIsSearching(false);
            setSearchingMatch(false);
            navigate('/duel');
          } else {
            setSearchError('対戦IDの取得に失敗しました。');
            setIsSearching(false);
            setSearchingMatch(false);
          }
        }
        if (data.status === 'cancelled' || data.status === 'none') {
          clearInterval(interval);
          setIsSearching(false);
          setSearchingMatch(false);
        }
      } catch (e) {
        clearInterval(interval);
        setIsSearching(false);
        setSearchingMatch(false);
      }
    }, 1500);
  };

  /**
   * Test function to send a simple message
   */
  const handleTestMessage = () => {
    console.log('=== TEST MESSAGE BUTTON CLICKED ===');
    console.log('isConnected:', isConnected);
    console.log('sendMessage function:', typeof sendMessage);
    
    try {
      const testMessage = {
        type: 'test',
        content: 'This is a test message',
        userId: user?.uid,
      };
      console.log('Sending test message:', testMessage);
      sendMessage(testMessage);
      console.log('Test message sent successfully');
    } catch (error) {
      console.error('Error sending test message:', error);
    }
  };

  /**
   * Handle starting matchmaking
   */
  const handleStartMatch = async () => {
    console.log('=== START MATCH BUTTON CLICKED ===');
    console.log('isConnected:', isConnected);
    console.log('user:', user?.uid);
    console.log('sendMessage function exists:', typeof sendMessage === 'function');
    
    if (!isConnected) {
      console.log('WebSocket not connected, showing error');
      setSearchError('サーバーに接続されていません。再試行してください。');
      setMatchmakingError('サーバーに接続されていません。再試行してください。');
      return;
    }
    setIsSearching(true);
    setSearchError(null);
    setSearchingMatch(true);
    setMatchmakingError(null);

    try {
      const user = getAuth().currentUser;
      const idToken = user ? await user.getIdToken() : null;
      const res = await fetch('/api/matchmaking/join', {
        method: 'POST',
        credentials: 'include',
        headers: idToken ? { 'Authorization': `Bearer ${idToken}` } : {},
      });
      const data = await res.json();
      if (data.status === 'matched' && data.duelId) {
        setDuelId(data.duelId);
        setIsSearching(false);
        setSearchingMatch(false);
        navigate('/duel');
      } else {
        pollMatchStatus(idToken || undefined); // nullをundefinedに変換
      }
    } catch (error) {
      const errorMessage = 'マッチメイキングの開始に失敗しました。再試行してください。';
      setSearchError(errorMessage);
      setMatchmakingError(errorMessage);
      setIsSearching(false);
      setSearchingMatch(false);
    }
  };

  /**
   * Handle canceling matchmaking
   */
  const handleCancelMatch = async () => {
    try {
      const user = getAuth().currentUser;
      const idToken = user ? await user.getIdToken() : null;
      await fetch('/api/matchmaking/cancel', {
        method: 'POST',
        credentials: 'include',
        headers: idToken ? { 'Authorization': `Bearer ${idToken}` } : {},
      });
      setIsSearching(false);
      setSearchingMatch(false);
      setSearchError(null);
      setMatchmakingError(null);
      console.log('マッチメイキングをキャンセルしました');
    } catch (error) {
      console.error('Error canceling match:', error);
    }
  };

  /**
   * Handle sign out
   */
  const handleSignOut = async () => {
    try {
      await logout();
      setIsSearching(false);
      setSearchingMatch(false);
      setSearchError(null);
      setMatchmakingError(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Loading state
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-slate-800 rounded-lg shadow-2xl p-8 border border-slate-700">
            {/* Logo/Title */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-white mb-2">Go Card</h1>
              <p className="text-slate-400">オンラインカードゲーム</p>
            </div>

            {/* Auth mode toggle */}
            <div className="flex mb-6 bg-slate-700 rounded-lg p-1">
              <button
                onClick={() => setAuthMode('google')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  authMode === 'google'
                    ? 'bg-slate-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Google
              </button>
              <button
                onClick={() => setAuthMode('email')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  authMode === 'email'
                    ? 'bg-slate-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                メール
              </button>
            </div>

            {authMode === 'google' ? (
              <>
                {/* Google Sign in button */}
                <button
                  onClick={signInWithGoogle}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-3"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span>Googleでサインイン</span>
                </button>
              </>
            ) : (
              <div className="bg-white rounded-lg">
                <EmailAuthForm />
              </div>
            )}

            {/* Connection status */}
            <div className="mt-4 text-center">
              <div className={`inline-flex items-center space-x-2 text-sm ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
                <span>{isConnected ? 'サーバーに接続済み' : 'サーバーに接続中...'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated state
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-slate-800 rounded-lg shadow-2xl p-8 border border-slate-700">
          {/* Welcome header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">ようこそ</h1>
            <p className="text-slate-300">{user.displayName || user.email}</p>
          </div>

          {/* Connection status */}
          <div className="mb-6 text-center">
            <div className={`inline-flex items-center space-x-2 text-sm ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
              <span>{isConnected ? 'サーバーに接続済み' : 'サーバーに接続中...'}</span>
            </div>
          </div>

          {/* Error message */}
          {searchError && (
            <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded text-red-300 text-sm">
              {searchError}
            </div>
          )}

          {/* Action buttons */}
          <div className="space-y-4">
            {/* Test message button - for debugging */}
            <button
              onClick={handleTestMessage}
              disabled={!isConnected}
              className={`w-full py-2 px-6 rounded-lg font-semibold transition-all duration-200 ${
                isConnected
                  ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                  : 'bg-slate-600 text-slate-400 cursor-not-allowed'
              }`}
            >
              テストメッセージ送信
            </button>

            {/* Start match button */}
            <button
              onClick={handleStartMatch}
              disabled={!isConnected || isSearching}
              className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 ${
                isSearching
                  ? 'bg-blue-600 text-white cursor-not-allowed'
                  : isConnected
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-slate-600 text-slate-400 cursor-not-allowed'
              }`}
            >
              {isSearching ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>対戦相手を探しています...</span>
                </div>
              ) : (
                '対戦開始'
              )}
            </button>

            {/* Cancel match button - only show when searching */}
            {isSearching && (
              <button
                onClick={handleCancelMatch}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200"
              >
                マッチングをキャンセル
              </button>
            )}

            {/* Card gallery button */}
            <button
              onClick={() => navigate('/cards')}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200"
            >
              カードギャラリー
            </button>

            {/* Sign out button */}
            <button
              onClick={handleSignOut}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200"
            >
              サインアウト
            </button>
          </div>

          {/* Game rules or info */}
          <div className="mt-8 text-center text-slate-400 text-sm">
            <p>カードを使って相手のHPを0にしよう！</p>
          </div>
        </div>
      </div>
    </div>
  );
};
