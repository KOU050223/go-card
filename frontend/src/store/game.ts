/**
 * Game state management using Zustand
 * Manages player HP, hand cards, turn state, and game actions
 */
import { create } from 'zustand';
import type { Card, Player, GameState, GamePhase } from '../types/game';

// Extended game state for UI management
interface GameUIState extends Partial<GameState> {
  // UI specific states
  selectedCard: Card | null;
  isConnected: boolean;
  connectionError: string | null;
  
  // Room and matchmaking states
  currentRoom: any | null;
  isSearchingMatch: boolean;
  matchmakingError: string | null;

  // duelIdを追加
  duelId: string | null;

  // Actions
  setPlayer: (player: Player | undefined) => void;
  setOpponent: (opponent: Player | undefined) => void;
  setCurrentTurn: (turn: 'player' | 'opponent') => void;
  setPhase: (phase: GamePhase) => void;
  setSelectedCard: (card: Card | null) => void;
  setConnectionStatus: (isConnected: boolean, error?: string | null) => void;
  updatePlayerHp: (hp: number) => void;
  updateOpponentHp: (hp: number) => void;
  addCardToHand: (card: Card) => void;
  removeCardFromHand: (cardId: string) => void;
  setHand: (cards: Card[]) => void;
  setIsMyTurn: (isMyTurn: boolean) => void;
  setGameStatus: (status: 'waiting' | 'playing' | 'finished') => void;
  setWinner: (winner: 'player' | 'opponent' | undefined) => void;
  // Room and matchmaking actions
  setCurrentRoom: (room: any | null) => void;
  setSearchingMatch: (isSearching: boolean) => void;
  setMatchmakingError: (error: string | null) => void;
  resetGame: () => void;
  setDuelId: (duelId: string | null) => void;
}

// Initial state
const initialState: Partial<GameState> & { 
  selectedCard: Card | null; 
  isConnected: boolean; 
  connectionError: string | null;
  currentRoom: any | null;
  isSearchingMatch: boolean;
  matchmakingError: string | null;
  duelId: string | null;
} = {
  gameId: '',
  player: undefined,
  opponent: undefined,
  currentTurn: 'player',
  phase: 'draw',
  turnNumber: 1,
  winner: undefined,
  selectedCard: null,
  isConnected: false,
  connectionError: null,
  currentRoom: null,
  isSearchingMatch: false,
  matchmakingError: null,
  duelId: null,
};

/**
 * Game store using Zustand for state management
 */
export const useGameStore = create<GameUIState>((set) => ({
  ...initialState,

  // Player management
  setPlayer: (player) => set({ player }),
  setOpponent: (opponent) => set({ opponent }),

  // Turn management
  setCurrentTurn: (currentTurn) => set({ currentTurn }),
  setPhase: (phase) => set({ phase }),

  // Card management
  setSelectedCard: (selectedCard) => set({ selectedCard }),
  
  addCardToHand: (card) => set((state) => {
    if (!state.player) return state;
    const updatedPlayer = {
      ...state.player,
      hand: [...state.player.hand, card],
    };
    return { player: updatedPlayer };
  }),

  removeCardFromHand: (cardId) => set((state) => {
    if (!state.player) return state;
    const updatedPlayer = {
      ...state.player,
      hand: state.player.hand.filter(card => card.id !== cardId),
    };
    return { player: updatedPlayer };
  }),

  // Connection management
  setConnectionStatus: (isConnected, error = null) => 
    set({ isConnected, connectionError: error }),

  // Room and matchmaking management
  setCurrentRoom: (currentRoom) => set({ currentRoom }),
  setSearchingMatch: (isSearchingMatch) => set({ isSearchingMatch }),
  setMatchmakingError: (matchmakingError) => set({ matchmakingError }),

  // Game state management
  setHand: (cards) => set((state) => {
    if (!state.player) return state;
    const updatedPlayer = {
      ...state.player,
      hand: cards,
    };
    return { player: updatedPlayer };
  }),

  setIsMyTurn: (isMyTurn) => set(() => ({
    currentTurn: isMyTurn ? 'player' : 'opponent'
  })),

  setGameStatus: (status) => set(() => {
    // Map status to appropriate game phase
    let phase: GamePhase = 'draw';
    if (status === 'playing') {
      phase = 'battle';
    } else if (status === 'finished') {
      phase = 'end';
    }
    return { phase };
  }),

  setWinner: (winner) => set({ winner }),

  // HP management
  updatePlayerHp: (hp) => set((state) => {
    if (!state.player) return state;
    const updatedPlayer = {
      ...state.player,
      health: Math.max(0, Math.min(hp, state.player.maxHealth)),
    };
    return { player: updatedPlayer };
  }),

  updateOpponentHp: (hp) => set((state) => {
    if (!state.opponent) return state;
    const updatedOpponent = {
      ...state.opponent,
      health: Math.max(0, Math.min(hp, state.opponent.maxHealth)),
    };
    return { opponent: updatedOpponent };
  }),

  // Reset game state
  resetGame: () => set(() => initialState),
  setDuelId: (duelId) => set({ duelId }),
}));
