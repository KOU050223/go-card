/**
 * DuelPage component for the main game interface
 * Displays player HP, opponent HP, hand cards, and handles game actions
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { demoGameState } from '../store/demo';
import { useSocket } from '../hooks/useSocket';
import { Card } from '../components/Card';
import { HealthBar } from '../components/HealthBar';
import type { Card as CardType } from '../types/game';

/**
 * DuelPage component that renders the main game interface
 */
export const DuelPage: React.FC = () => {
  const navigate = useNavigate();
  const { sendMessage, isConnected } = useSocket();
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null);
  const [gameStatus] = useState<'waiting' | 'playing' | 'finished'>('playing');
  const [isMyTurn] = useState(true);
  
  // Use demo data
  const player = demoGameState.player;
  const opponent = demoGameState.opponent;
  const hand = player.hand;

  /**
   * Handle card selection and attack
   */
  const handleCardClick = (card: CardType) => {
    if (!isMyTurn || gameStatus !== 'playing') {
      return;
    }

    if (selectedCard?.id === card.id) {
      // Deselect if clicking the same card
      setSelectedCard(null);
    } else {
      // Select the card
      setSelectedCard(card);
    }
  };

  /**
   * Handle attack action
   */
  const handleAttack = () => {
    if (!selectedCard || !isMyTurn || gameStatus !== 'playing') {
      return;
    }

    // Send attack message to server
    sendMessage({
      type: 'attack',
      cardId: selectedCard.id,
      attackPower: selectedCard.attack,
    });

    // Clear selection
    setSelectedCard(null);
  };

  /**
   * Handle returning to lobby
   */
  const handleReturnToLobby = () => {
    navigate('/');
  };

  // Waiting for game to start
  if (gameStatus === 'waiting' || !player || !opponent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="bg-slate-800 rounded-lg shadow-2xl p-8 border border-slate-700 max-w-md mx-4">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">対戦準備中</h2>
            <p className="text-slate-300 mb-6">
              {!isConnected ? 'サーバーに接続中...' : '対戦相手を待っています...'}
            </p>
            <button
              onClick={handleReturnToLobby}
              className="bg-slate-600 hover:bg-slate-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200"
            >
              キャンセル
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main game interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header with connection status */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={handleReturnToLobby}
            className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-colors duration-200"
          >
            ← ロビーに戻る
          </button>
          
          <div className={`flex items-center space-x-2 ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
            <span className="text-sm">{isConnected ? '接続中' : '切断'}</span>
          </div>
        </div>

        {/* Opponent area */}
        <div className="mb-8">
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h3 className="text-white text-lg font-semibold mb-4">相手</h3>
            <HealthBar
              currentHp={opponent.health}
              maxHp={opponent.maxHealth}
              playerName={opponent.name}
              size="large"
            />
            <div className="mt-4 flex items-center justify-between text-slate-400 text-sm">
              <span>手札: {opponent.hand.length} 枚</span>
              <span>マナ: {opponent.mana}/{opponent.maxMana}</span>
            </div>
          </div>
        </div>

        {/* Game status */}
        <div className="text-center mb-6">
          <div className={`inline-block px-4 py-2 rounded-lg font-semibold ${
            isMyTurn 
              ? 'bg-green-600 text-white' 
              : 'bg-slate-600 text-slate-300'
          }`}>
            {isMyTurn ? 'あなたのターン' : '相手のターン'}
          </div>
        </div>

        {/* Player area */}
        <div className="mb-8">
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h3 className="text-white text-lg font-semibold mb-4">あなた</h3>
            <HealthBar
              currentHp={player.health}
              maxHp={player.maxHealth}
              playerName={player.name}
              size="large"
            />
            <div className="mt-4 flex items-center justify-between text-slate-400 text-sm">
              <span>手札: {hand.length} 枚</span>
              <span>マナ: {player.mana}/{player.maxMana}</span>
            </div>
          </div>
        </div>

        {/* Hand cards */}
        <div className="mb-6">
          <h3 className="text-white text-lg font-semibold mb-4">手札</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {hand.map((card) => (
              <Card
                key={card.id}
                card={card}
                isSelected={selectedCard?.id === card.id}
                isPlayable={isMyTurn && gameStatus === 'playing' && player.mana >= card.cost}
                onClick={handleCardClick}
              />
            ))}
          </div>
          
          {/* Empty hand message */}
          {hand.length === 0 && (
            <div className="text-center text-slate-400 py-8">
              手札にカードがありません
            </div>
          )}
        </div>

        {/* Action buttons */}
        {selectedCard && isMyTurn && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-slate-800 rounded-lg p-4 border border-slate-700 shadow-2xl">
            <div className="flex items-center space-x-4">
              <div className="text-white">
                <span className="font-semibold">{selectedCard.name}</span>を使用
                <span className="block text-sm text-slate-400">
                  コスト: {selectedCard.cost} | 攻撃力: {selectedCard.attack} | 体力: {selectedCard.defense}
                </span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleAttack}
                  disabled={player.mana < selectedCard.cost}
                  className={`font-semibold py-2 px-6 rounded-lg transition-colors duration-200 ${
                    player.mana >= selectedCard.cost
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-slate-600 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  プレイ
                </button>
                <button
                  onClick={() => setSelectedCard(null)}
                  className="bg-slate-600 hover:bg-slate-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  キャンセル
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
