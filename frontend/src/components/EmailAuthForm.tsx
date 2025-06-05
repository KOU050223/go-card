/**
 * Email authentication form component
 * Provides login and signup with email/password
 */
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface EmailAuthFormProps {
  isLogin?: boolean;
}

export const EmailAuthForm: React.FC<EmailAuthFormProps> = ({ isLogin = true }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup'>(isLogin ? 'login' : 'signup');

  const { signInWithEmail, signUpWithEmail } = useAuth();

  const handleTestLogin = async (email: string, password: string) => {
    setError('');
    setLoading(true);

    try {
      // 最初にログインを試行
      await signInWithEmail(email, password);
      console.log(`Successfully logged in with: ${email}`);
    } catch (error: any) {
      // ログインに失敗した場合、アカウントを作成してから再度ログインを試行
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        try {
          console.log(`Creating test account: ${email}`);
          await signUpWithEmail(email, password);
          console.log(`Successfully created and logged in with: ${email}`);
        } catch (signUpError: any) {
          console.error('Test account creation error:', signUpError);
          // アカウント作成エラーの詳細なハンドリング
          if (signUpError.code === 'auth/email-already-in-use') {
            // メールアドレスが既に使用されている場合、再度ログインを試行
            try {
              await signInWithEmail(email, password);
              console.log(`Account exists, logged in with: ${email}`);
            } catch (retryError: any) {
              console.error('Retry login error:', retryError);
              setError('ログインに失敗しました。パスワードを確認してください。');
            }
          } else {
            setError(`テストアカウントの作成に失敗しました: ${getErrorMessage(signUpError.code)}`);
          }
        }
      } else {
        console.error('Test login error:', error);
        setError(getErrorMessage(error.code));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (mode === 'signup' && password !== confirmPassword) {
      setError('パスワードが一致しません');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('パスワードは6文字以上で入力してください');
      setLoading(false);
      return;
    }

    try {
      if (mode === 'login') {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password);
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
      setError(getErrorMessage(error.code));
    } finally {
      setLoading(false);
    }
  };

  const getErrorMessage = (errorCode: string): string => {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'ユーザーが見つかりません';
      case 'auth/wrong-password':
        return 'パスワードが間違っています';
      case 'auth/email-already-in-use':
        return 'このメールアドレスは既に使用されています';
      case 'auth/weak-password':
        return 'パスワードが弱すぎます';
      case 'auth/invalid-email':
        return 'メールアドレスの形式が正しくありません';
      default:
        return '認証エラーが発生しました';
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center mb-6">
        {mode === 'login' ? 'メールでログイン' : 'アカウント作成'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            メールアドレス
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="example@email.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            パスワード
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="6文字以上"
          />
        </div>

        {mode === 'signup' && (
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              パスワード確認
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="パスワードを再入力"
            />
          </div>
        )}

        {error && (
          <div className="text-red-600 text-sm text-center">{error}</div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '処理中...' : mode === 'login' ? 'ログイン' : 'アカウント作成'}
        </button>
      </form>

      <div className="mt-4 text-center">
        <button
          type="button"
          onClick={() => {
            setMode(mode === 'login' ? 'signup' : 'login');
            setError('');
          }}
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          {mode === 'login' ? 'アカウントを作成' : 'ログインページに戻る'}
        </button>
      </div>

      {/* テスト用アカウント情報 */}
      <div className="mt-6 p-4 bg-gray-100 rounded-md">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">テスト用アカウント</h3>
        <div className="text-xs text-gray-600 space-y-3">
          <div>
            <p className="font-medium">プレイヤー1:</p>
            <p>メール: player1@example.com</p>
            <p>パスワード: test123</p>
            <button
              type="button"
              onClick={() => handleTestLogin('player1@example.com', 'test123')}
              disabled={loading}
              className="mt-1 text-xs bg-blue-200 px-2 py-1 rounded hover:bg-blue-300 disabled:opacity-50"
            >
              プレイヤー1でログイン
            </button>
          </div>
          
          <div>
            <p className="font-medium">プレイヤー2:</p>
            <p>メール: player2@example.com</p>
            <p>パスワード: test123</p>
            <button
              type="button"
              onClick={() => handleTestLogin('player2@example.com', 'test123')}
              disabled={loading}
              className="mt-1 text-xs bg-green-200 px-2 py-1 rounded hover:bg-green-300 disabled:opacity-50"
            >
              プレイヤー2でログイン
            </button>
          </div>

          <div>
            <p className="font-medium">従来のテストアカウント:</p>
            <p>メール: test@example.com</p>
            <p>パスワード: test123</p>
            <button
              type="button"
              onClick={() => handleTestLogin('test@example.com', 'test123')}
              disabled={loading}
              className="mt-1 text-xs bg-gray-200 px-2 py-1 rounded hover:bg-gray-300 disabled:opacity-50"
            >
              テストアカウントを使用
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
