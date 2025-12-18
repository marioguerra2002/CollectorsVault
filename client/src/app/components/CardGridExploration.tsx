'use client';
interface Card {
  id: string;
  name?: string;
  value: number;
  imageUrl?: string;
  isTradable?: boolean; 
  condition?: string;
}
interface CardGridProps {
  cards: Card[];
  onCardClick: (cardId: string) => void;
  onToggleTradable?: (cardId: string) => void;
}