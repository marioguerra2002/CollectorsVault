export type TradeCardType = 'PokemonCard' | 'TrainerCard' | 'EnergyCard';
export interface ITradeSide {
  userId: string;
  cards: {
    cardType: TradeCardType;
    cardId: string;
  }[];
  accepted: boolean;
}
export type ChatMessageKind = 'text' | 'proposal' | 'system';
export interface ITextMessagePayload {
  text: string;
  reason?: 'accepted' | 'deleted';
}
export interface IProposalMessagePayload {
  tempTradeId: string;
  proposer: ITradeSide;
  receiver: ITradeSide;
}
export interface IChatSocketMessage {
  roomId: string;
  kind: ChatMessageKind;
  payload: ITextMessagePayload | IProposalMessagePayload;
  createdAt: number;
  fromUserId: string;
  toUserId?: string;
  meta?: {
    skipPersist?: boolean;
  };
}
export interface ChatMessage {
  id: string | number;
  kind: ChatMessageKind;
  payload: ITextMessagePayload | IProposalMessagePayload;
  isMe: boolean;
  fromUserId: string;
  createdAt: number;
}
