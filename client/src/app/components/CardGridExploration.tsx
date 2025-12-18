'use client';
import Image from 'next/image';
interface CardGridProps {
  cards: Card[];
  onCardClick: (cardId: string) => void;
  onToggleTradable?: (cardId: string) => void;
}