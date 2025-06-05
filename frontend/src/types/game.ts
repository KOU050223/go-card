/**
 * Game types and interfaces for Go Card game
 */

export interface Card {
  id: string;
  name: string;
  cost: number;
  attack: number;
  defense: number;
  description: string;
  type: CardType;
  rarity: CardRarity;
  image?: string;
  effects?: CardEffect[];
}

export type CardType = 'creature' | 'spell' | 'artifact';

export type CardRarity = 'common' | 'uncommon' | 'rare' | 'legendary';

export interface CardEffect {
  type: 'damage' | 'heal' | 'buff' | 'debuff' | 'draw';
  value: number;
  target: 'self' | 'opponent' | 'all';
}

export interface Player {
  id: string;
  name: string;
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  hand: Card[];
  deck: Card[];
  field: Card[];
}

export interface GameState {
  gameId: string;
  player: Player;
  opponent: Player;
  currentTurn: 'player' | 'opponent';
  phase: GamePhase;
  turnNumber: number;
  winner?: 'player' | 'opponent';
}

export type GamePhase = 'draw' | 'main' | 'battle' | 'end';

export interface GameAction {
  type: 'playCard' | 'attack' | 'endTurn' | 'surrender';
  cardId?: string;
  targetId?: string;
  playerId: string;
}

export interface WebSocketMessage {
  type: string;
  data?: any;
  playerId?: string;
  gameId?: string;
  timestamp?: number;
}
