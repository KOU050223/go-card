/**
 * Card database with predefined cards for the Go Card game
 */
import type { Card } from '../types/game';

export const CARD_DATABASE: Record<string, Card> = {
  // Common Creatures
  'goblin-warrior': {
    id: 'goblin-warrior',
    name: 'ゴブリン戦士',
    cost: 1,
    attack: 2,
    defense: 1,
    description: '小さくても勇敢な戦士',
    type: 'creature',
    rarity: 'common',
  },
  'forest-wolf': {
    id: 'forest-wolf',
    name: '森のオオカミ',
    cost: 2,
    attack: 3,
    defense: 2,
    description: '野生の本能で敵を追い詰める',
    type: 'creature',
    rarity: 'common',
  },
  'knight-guard': {
    id: 'knight-guard',
    name: '騎士の護衛',
    cost: 3,
    attack: 2,
    defense: 4,
    description: '鉄壁の守りを誇る騎士',
    type: 'creature',
    rarity: 'common',
  },

  // Uncommon Creatures
  'flame-dragon': {
    id: 'flame-dragon',
    name: '炎の竜',
    cost: 4,
    attack: 5,
    defense: 3,
    description: '炎を吐く強大な竜',
    type: 'creature',
    rarity: 'uncommon',
    effects: [{ type: 'damage', value: 1, target: 'opponent' }],
  },
  'ice-wizard': {
    id: 'ice-wizard',
    name: '氷の魔法使い',
    cost: 3,
    attack: 2,
    defense: 3,
    description: '氷の魔法で敵を凍らせる',
    type: 'creature',
    rarity: 'uncommon',
    effects: [{ type: 'debuff', value: -1, target: 'opponent' }],
  },

  // Rare Creatures
  'ancient-golem': {
    id: 'ancient-golem',
    name: '古代のゴーレム',
    cost: 5,
    attack: 4,
    defense: 6,
    description: '古代の力を宿した石の巨人',
    type: 'creature',
    rarity: 'rare',
  },
  'shadow-assassin': {
    id: 'shadow-assassin',
    name: '影の暗殺者',
    cost: 4,
    attack: 6,
    defense: 2,
    description: '影に潜み、一撃で敵を仕留める',
    type: 'creature',
    rarity: 'rare',
  },

  // Legendary Creatures
  'dragon-lord': {
    id: 'dragon-lord',
    name: '竜王',
    cost: 7,
    attack: 8,
    defense: 6,
    description: 'すべての竜を統べる王',
    type: 'creature',
    rarity: 'legendary',
    effects: [
      { type: 'damage', value: 3, target: 'opponent' },
      { type: 'buff', value: 2, target: 'self' },
    ],
  },
  'light-goddess': {
    id: 'light-goddess',
    name: '光の女神',
    cost: 6,
    attack: 5,
    defense: 7,
    description: '神聖な光で味方を癒す',
    type: 'creature',
    rarity: 'legendary',
    effects: [{ type: 'heal', value: 5, target: 'self' }],
  },

  // Spells
  'fireball': {
    id: 'fireball',
    name: 'ファイアボール',
    cost: 2,
    attack: 0,
    defense: 0,
    description: '敵に3ダメージを与える',
    type: 'spell',
    rarity: 'common',
    effects: [{ type: 'damage', value: 3, target: 'opponent' }],
  },
  'healing-potion': {
    id: 'healing-potion',
    name: '治癒の薬',
    cost: 1,
    attack: 0,
    defense: 0,
    description: 'HPを3回復する',
    type: 'spell',
    rarity: 'common',
    effects: [{ type: 'heal', value: 3, target: 'self' }],
  },
  'lightning-bolt': {
    id: 'lightning-bolt',
    name: '雷撃',
    cost: 3,
    attack: 0,
    defense: 0,
    description: '敵に5ダメージを与える強力な魔法',
    type: 'spell',
    rarity: 'uncommon',
    effects: [{ type: 'damage', value: 5, target: 'opponent' }],
  },

  // Artifacts
  'sword-of-power': {
    id: 'sword-of-power',
    name: '力の剣',
    cost: 2,
    attack: 2,
    defense: 0,
    description: '攻撃力を2上昇させる',
    type: 'artifact',
    rarity: 'uncommon',
    effects: [{ type: 'buff', value: 2, target: 'self' }],
  },
  'shield-of-defense': {
    id: 'shield-of-defense',
    name: '守りの盾',
    cost: 2,
    attack: 0,
    defense: 3,
    description: '防御力を3上昇させる',
    type: 'artifact',
    rarity: 'uncommon',
    effects: [{ type: 'buff', value: 3, target: 'self' }],
  },
};

/**
 * Get random cards for initial deck
 */
export function generateRandomDeck(size: number = 20): Card[] {
  const cards = Object.values(CARD_DATABASE);
  const deck: Card[] = [];
  
  for (let i = 0; i < size; i++) {
    const randomCard = cards[Math.floor(Math.random() * cards.length)];
    // Create a copy with unique ID
    deck.push({
      ...randomCard,
      id: `${randomCard.id}-${i}`,
    });
  }
  
  return deck;
}

/**
 * Get initial hand from deck
 */
export function drawInitialHand(deck: Card[], handSize: number = 5): { hand: Card[], remainingDeck: Card[] } {
  const shuffled = [...deck].sort(() => Math.random() - 0.5);
  const hand = shuffled.slice(0, handSize);
  const remainingDeck = shuffled.slice(handSize);
  
  return { hand, remainingDeck };
}
