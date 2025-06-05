import React from 'react';
import type { Card as CardType } from '../types/game';

interface CardProps {
  card: CardType;
  isSelected?: boolean;
  isPlayable?: boolean;
  onClick?: (card: CardType) => void;
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

export const Card: React.FC<CardProps> = ({
  card,
  isSelected = false,
  isPlayable = true,
  onClick,
  className = '',
  size = 'medium',
}) => {
  const handleClick = () => {
    if (isPlayable && onClick) {
      onClick(card);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-gray-400 bg-gray-100';
      case 'uncommon': return 'border-green-400 bg-green-100';
      case 'rare': return 'border-blue-400 bg-blue-100';
      case 'legendary': return 'border-orange-400 bg-orange-100';
      default: return 'border-gray-400 bg-gray-100';
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

  const getSizeClasses = () => {
    switch (size) {
      case 'small': return 'w-32 h-48 text-xs';
      case 'large': return 'w-56 h-80 text-base';
      default: return 'w-48 h-72 text-sm';
    }
  };

  return (
    <div
      className={`
        ${getSizeClasses()}
        relative bg-gradient-to-br from-slate-800 to-slate-900 
        border-2 rounded-xl overflow-hidden cursor-pointer group
        transition-all duration-300 ease-in-out transform-gpu
        ${isSelected 
          ? 'border-blue-400 shadow-2xl shadow-blue-400/50 scale-105 -translate-y-2' 
          : 'border-slate-600 hover:border-slate-400'
        }
        ${isPlayable 
          ? 'hover:scale-105 hover:-translate-y-2 hover:shadow-xl hover:shadow-slate-900/50' 
          : 'opacity-50 cursor-not-allowed'
        }
        ${className}
      `}
      onClick={handleClick}
    >
      {/* Cost badge */}
      <div className="absolute top-2 left-2 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm z-10 border-2 border-white shadow-lg">
        {card.cost}
      </div>

      {/* Rarity indicator */}
      <div className={`absolute top-2 right-2 w-6 h-6 rounded-full ${getRarityColor(card.rarity)} border-2 z-10 shadow-lg`} />

      {/* Card image placeholder */}
      <div className="h-32 bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center border-b border-slate-600 relative">
        <div className="text-4xl filter drop-shadow-lg">{getTypeIcon(card.type)}</div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-opacity duration-500" />
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
          <p className="text-slate-300 text-xs leading-relaxed line-clamp-3">
            {card.description}
          </p>
        </div>

        {/* Stats */}
        {card.type === 'creature' && (
          <div className="flex justify-between items-center">
            {/* Attack */}
            <div className="flex items-center space-x-1 bg-red-600/20 px-2 py-1 rounded-md border border-red-600/30 backdrop-blur-sm">
              <span className="text-red-400 text-xs font-medium">⚔️</span>
              <span className="text-red-300 font-bold text-sm">{card.attack}</span>
            </div>
            
            {/* Health */}
            <div className="flex items-center space-x-1 bg-blue-600/20 px-2 py-1 rounded-md border border-blue-600/30 backdrop-blur-sm">
              <span className="text-blue-400 text-xs font-medium">🛡️</span>
              <span className="text-blue-300 font-bold text-sm">{card.defense}</span>
            </div>
          </div>
        )}

        {/* Spell/Artifact effects */}
        {(card.type === 'spell' || card.type === 'artifact') && card.effects && (
          <div className="text-center">
            <div className="bg-purple-600/20 px-2 py-1 rounded-md border border-purple-600/30 backdrop-blur-sm">
              <span className="text-purple-300 text-xs font-medium">
                {card.effects.length} Effect{card.effects.length > 1 ? 's' : ''}
              </span>
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
