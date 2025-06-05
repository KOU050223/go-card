/**
 * HealthBar component for displaying player HP with visual indicators
 * Shows current HP, max HP, and animated health bar
 */
import React from 'react';

interface HealthBarProps {
  currentHp: number;
  maxHp: number;
  playerName?: string;
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

/**
 * HealthBar component that renders an animated health bar with HP text
 * @param currentHp - Current health points
 * @param maxHp - Maximum health points
 * @param playerName - Optional player name to display
 * @param className - Additional CSS classes
 * @param size - Size variant of the health bar
 */
export const HealthBar: React.FC<HealthBarProps> = ({
  currentHp,
  maxHp,
  playerName,
  className = '',
  size = 'medium',
}) => {
  const healthPercentage = Math.max(0, Math.min(100, (currentHp / maxHp) * 100));
  
  // Determine health bar color based on percentage
  const getHealthColor = () => {
    if (healthPercentage > 60) return 'bg-green-500';
    if (healthPercentage > 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Size configurations
  const sizeClasses = {
    small: {
      container: 'h-4',
      text: 'text-xs',
      bar: 'h-4',
      name: 'text-xs',
    },
    medium: {
      container: 'h-6',
      text: 'text-sm',
      bar: 'h-6',
      name: 'text-sm',
    },
    large: {
      container: 'h-8',
      text: 'text-base',
      bar: 'h-8',
      name: 'text-lg',
    },
  };

  const sizeConfig = sizeClasses[size];

  return (
    <div className={`space-y-1 ${className}`}>
      {/* Player name */}
      {playerName && (
        <div className={`text-white font-semibold ${sizeConfig.name}`}>
          {playerName}
        </div>
      )}

      {/* Health bar container */}
      <div className={`relative bg-slate-700 rounded-full overflow-hidden border border-slate-600 ${sizeConfig.container}`}>
        {/* Health bar fill */}
        <div
          className={`${getHealthColor()} ${sizeConfig.bar} transition-all duration-500 ease-out rounded-full`}
          style={{ width: `${healthPercentage}%` }}
        />

        {/* HP text overlay */}
        <div className={`absolute inset-0 flex items-center justify-center text-white font-bold ${sizeConfig.text} drop-shadow-lg`}>
          {currentHp} / {maxHp}
        </div>

        {/* Shine effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full opacity-30" />
      </div>

      {/* Health percentage indicator */}
      <div className="flex justify-between items-center">
        <div className={`text-slate-400 ${sizeConfig.text}`}>
          HP: {Math.round(healthPercentage)}%
        </div>
        
        {/* Critical health warning */}
        {healthPercentage <= 20 && currentHp > 0 && (
          <div className={`text-red-400 font-bold animate-pulse ${sizeConfig.text}`}>
            ⚠ Critical!
          </div>
        )}

        {/* KO indicator */}
        {currentHp <= 0 && (
          <div className={`text-red-500 font-bold ${sizeConfig.text}`}>
            💀 K.O.
          </div>
        )}
      </div>
    </div>
  );
};
