/**
 * Demo data and simple state for the card game
 */
import { generateRandomDeck } from '../data/cards';
import type { Card } from '../types/game';

// Demo player data
export const demoPlayerData = {
  id: 'player-1',
  name: 'プレイヤー',
  health: 25,
  maxHealth: 30,
  mana: 5,
  maxMana: 10,
  hand: generateRandomDeck(7),
  deck: generateRandomDeck(20),
  field: [],
};

export const demoOpponentData = {
  id: 'opponent-1', 
  name: '対戦相手',
  health: 20,
  maxHealth: 30,
  mana: 3,
  maxMana: 10,
  hand: generateRandomDeck(6),
  deck: generateRandomDeck(15),
  field: [],
};

// Simple game state for demo
export const demoGameState = {
  gameId: 'demo-game-1',
  player: demoPlayerData,
  opponent: demoOpponentData,
  currentTurn: 'player' as const,
  phase: 'main' as const,
  turnNumber: 3,
};

// Simple store for demo purposes
class SimpleGameStore {
  private selectedCard: Card | null = null;
  private listeners: (() => void)[] = [];

  getSelectedCard() {
    return this.selectedCard;
  }

  setSelectedCard(card: Card | null) {
    this.selectedCard = card;
    this.notifyListeners();
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }
}

export const gameStore = new SimpleGameStore();
