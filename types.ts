
export enum Sender {
  Storyteller = 'storyteller',
  Player = 'player',
}

export enum GamePhase {
  STARTING = 'STARTING',
  NARRATIVE = 'NARRATIVE',
  INVESTIGATION = 'INVESTIGATION',
  DIALOGUE = 'DIALOGUE',
}

export interface Message {
  sender: Sender;
  content: string;
  speaker?: string;
}

export interface InvestigationPoint {
  id: string;
  name:string;
}

export interface CollectedClue {
  id: string;
  name: string;
  description: string;
}

export interface GameState {
  location: string;
  locationImagePrompt: string;
  characters: string[];
  investigationPoints: InvestigationPoint[];
}

export interface GeminiResponse {
  narrative: string;
  speaker: string;
  gamePhase: GamePhase;
  scene: GameState;
}
