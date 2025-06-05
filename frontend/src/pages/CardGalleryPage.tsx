/**
 * Simple Card Gallery page to showcase the card game UI
 */
import React, { useState } from 'react';
import { demoPlayerData, demoOpponentData } from '../store/demo';

interface SimpleCard {
  id: string;
  name: string;
  cost: number;
  attack: number;
  defense: number;
  description: string;
  type: 'creature' | 'spell' | 'artifact';
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
}

const CardComponent: React.FC<{ card: SimpleCard; isSelected: boolean; onClick: () => void }> = ({ 
  card, 
  isSelected, 
  onClick 
}) => {
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-gray-400';
      case 'uncommon': return 'border-green-400';
      case 'rare': return 'border-blue-400';
      case 'legendary': return 'border-orange-400';
      default: return 'border-gray-400';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'creature': return '⚔️';
      case 'spell': return '✨';
      case 'artifact': return '🛡️';
      default: return '❓';
    }
  };

  return (
    <div
      className={`
        w-48 h-72 relative bg-gradient-to-br from-slate-800 to-slate-900 
        border-2 rounded-xl overflow-hidden cursor-pointer group
        transition-all duration-300 ease-in-out transform-gpu
        ${isSelected 
          ? 'border-blue-400 shadow-2xl shadow-blue-400/50 scale-105 -translate-y-2' 
          : 'border-slate-600 hover:border-slate-400'
        }
        hover:scale-105 hover:-translate-y-2 hover:shadow-xl hover:shadow-slate-900/50
      `}
      onClick={onClick}
    >
      {/* Cost badge */}
      <div className="absolute top-2 left-2 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm z-10 border-2 border-white shadow-lg">
        {card.cost}
      </div>

      {/* Rarity indicator */}
      <div className={`absolute top-2 right-2 w-6 h-6 rounded-full ${getRarityColor(card.rarity)} border-2 z-10 shadow-lg bg-white/20`} />

      {/* Card image placeholder */}
      <div className="h-32 bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center border-b border-slate-600 relative">
        <div className="text-4xl filter drop-shadow-lg">{getTypeIcon(card.type)}</div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>

      {/* Card content */}
      <div className="p-3 flex flex-col h-40">
        {/* Card name and type */}
        <div className="mb-2">
          <h3 className="text-white font-bold text-sm leading-tight mb-1 truncate drop-shadow-sm">
            {card.name}
          </h3>
          <p className="text-slate-400 text-xs capitalize">
            {card.type} • {card.rarity}
          </p>
        </div>

        {/* Description */}
        <div className="flex-1 mb-3">
          <p className="text-slate-300 text-xs leading-relaxed">
            {card.description}
          </p>
        </div>

        {/* Stats */}
        {card.type === 'creature' && (
          <div className="flex justify-between items-center">
            {/* Attack */}
            <div className="flex items-center space-x-1 bg-red-600/20 px-2 py-1 rounded-md border border-red-600/30">
              <span className="text-red-400 text-xs font-medium">⚔️</span>
              <span className="text-red-300 font-bold text-sm">{card.attack}</span>
            </div>
            
            {/* Defense */}
            <div className="flex items-center space-x-1 bg-blue-600/20 px-2 py-1 rounded-md border border-blue-600/30">
              <span className="text-blue-400 text-xs font-medium">🛡️</span>
              <span className="text-blue-300 font-bold text-sm">{card.defense}</span>
            </div>
          </div>
        )}
      </div>

      {/* Selection glow */}
      {isSelected && (
        <div className="absolute inset-0 bg-blue-400/10 border border-blue-400/50 rounded-xl pointer-events-none animate-pulse" />
      )}

      {/* Legendary glow */}
      {card.rarity === 'legendary' && (
        <div className="absolute inset-0 bg-gradient-to-r from-orange-400/5 via-yellow-400/5 to-orange-400/5 rounded-xl pointer-events-none animate-pulse" />
      )}
    </div>
  );
};

export const CardGalleryPage: React.FC = () => {
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  
  // Sample cards
  const sampleCards: SimpleCard[] = [
    {
      id: '1',
      name: 'ゴブリン戦士',
      cost: 1,
      attack: 2,
      defense: 1,
      description: '小さくても勇敢な戦士',
      type: 'creature',
      rarity: 'common',
    },
    {
      id: '2',
      name: '炎の竜',
      cost: 4,
      attack: 5,
      defense: 3,
      description: '炎を吐く強大な竜',
      type: 'creature',
      rarity: 'uncommon',
    },
    {
      id: '3',
      name: '竜王',
      cost: 7,
      attack: 8,
      defense: 6,
      description: 'すべての竜を統べる王',
      type: 'creature',
      rarity: 'legendary',
    },
    {
      id: '4',
      name: 'ファイアボール',
      cost: 2,
      attack: 0,
      defense: 0,
      description: '敵に3ダメージを与える',
      type: 'spell',
      rarity: 'common',
    },
    {
      id: '5',
      name: '力の剣',
      cost: 2,
      attack: 2,
      defense: 0,
      description: '攻撃力を2上昇させる',
      type: 'artifact',
      rarity: 'uncommon',
    },
    {
      id: '6',
      name: '古代のゴーレム',
      cost: 5,
      attack: 4,
      defense: 6,
      description: '古代の力を宿した石の巨人',
      type: 'creature',
      rarity: 'rare',
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="pt-8 pb-6 text-center">
        <h1 className="text-4xl font-bold text-white mb-2">Go Card Gallery</h1>
        <p className="text-slate-400">カードコレクション</p>
      </div>

      {/* Player stats demo */}
      <div className="max-w-6xl mx-auto px-4 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Player info */}
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <h3 className="text-white font-bold mb-3">プレイヤー</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-300">HP:</span>
                <span className="text-green-400 font-bold">{demoPlayerData.health}/{demoPlayerData.maxHealth}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">マナ:</span>
                <span className="text-blue-400 font-bold">{demoPlayerData.mana}/{demoPlayerData.maxMana}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">手札:</span>
                <span className="text-yellow-400 font-bold">{demoPlayerData.hand.length}枚</span>
              </div>
            </div>
          </div>

          {/* Opponent info */}
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <h3 className="text-white font-bold mb-3">対戦相手</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-300">HP:</span>
                <span className="text-green-400 font-bold">{demoOpponentData.health}/{demoOpponentData.maxHealth}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">マナ:</span>
                <span className="text-blue-400 font-bold">{demoOpponentData.mana}/{demoOpponentData.maxMana}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">手札:</span>
                <span className="text-yellow-400 font-bold">{demoOpponentData.hand.length}枚</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Card grid */}
      <div className="max-w-6xl mx-auto px-4 pb-8">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">カードギャラリー</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center">
          {sampleCards.map((card) => (
            <CardComponent
              key={card.id}
              card={card}
              isSelected={selectedCard === card.id}
              onClick={() => setSelectedCard(selectedCard === card.id ? null : card.id)}
            />
          ))}
        </div>
        
        {selectedCard && (
          <div className="mt-6 text-center">
            <p className="text-slate-300">
              選択中: <span className="text-blue-400 font-bold">
                {sampleCards.find(c => c.id === selectedCard)?.name}
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
