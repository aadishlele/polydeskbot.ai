export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isLoading?: boolean;
}

export type ViewState = 'portal' | 'chat';

export interface Dot {
  element: HTMLDivElement;
  initialX: number;
  initialY: number;
}