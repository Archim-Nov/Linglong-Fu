import React, { useRef, useEffect, useState } from 'react';
import { type GameState, type Message, GamePhase, type InvestigationPoint } from '../types';
import MessageBubble from './MessageBubble';
import DialogueInput from './ChatInterface';
import { ThreeDotsLoader } from './Loader';
import { MagnifyingGlassIcon, SpinnerIcon } from './icons/Icons';

// --- Sub-components for GameScreen ---

interface NarrativeBoxProps {
  speaker: string;
  content: string;
  onAdvance: () => void;
}

const NarrativeBox: React.FC<NarrativeBoxProps> = ({ speaker, content, onAdvance }) => (
  <div 
    className="absolute inset-0 bg-black/70 flex items-center justify-center p-4 sm:p-8 cursor-pointer backdrop-blur-sm z-20"
    onClick={onAdvance}
  >
    <div 
      className="max-w-4xl w-full max-h-[85vh] bg-[#1c1a17]/95 border-2 border-[#4a4238] p-6 sm:p-8 lg:p-10 rounded-lg shadow-2xl overflow-y-auto"
      onClick={(e) => e.stopPropagation()}
    >
      <p className="text-xl sm:text-2xl font-bold text-[#c8bba1] mb-4">{speaker}</p>
      <div className="text-base sm:text-lg leading-relaxed space-y-4 text-[#e4d8b4]">
        {content.split('\n').map((paragraph, index) => (
          <p key={index}>{paragraph || ' '}</p>
        ))}
      </div>
    </div>
    <div 
        className="absolute bottom-6 text-white/60 text-sm animate-pulse"
        onClick={onAdvance}
    >
        点击任意处继续...
    </div>
  </div>
);

// Pre-defined positions for hotspots to ensure a nice, non-overlapping layout
const hotspotPositions = [
  { top: '45%', left: '25%' }, { top: '70%', left: '70%' },
  { top: '30%', left: '80%' }, { top: '80%', left: '15%' },
  { top: '55%', left: '50%' }, { top: '25%', left: '10%' },
  { top: '60%', left: '90%' },
];

interface CluePopupProps {
  description: string;
  position: { top: string; left: string };
  onClose: () => void;
}

const CluePopup: React.FC<CluePopupProps> = ({ description, position, onClose }) => (
  <div
    className="absolute z-10"
    style={{
      top: position.top,
      left: position.left,
      transform: 'translate(-50%, -110%)', // Position it above the hotspot
    }}
  >
    <div className="relative bg-[#1c1a17]/90 border border-[#4a4238] rounded-lg shadow-xl text-[#e4d8b4] backdrop-blur-sm">
      <div className="max-w-sm max-h-48 overflow-y-auto p-4">
          <p className="text-sm leading-relaxed">{description}</p>
      </div>
      <button onClick={onClose} className="absolute -top-2 -right-2 w-6 h-6 bg-[#e4d8b4] text-[#4a2e1c] rounded-full flex items-center justify-center font-bold text-sm">
        ✕
      </button>
    </div>
  </div>
);

interface InvestigationUIProps {
  points: InvestigationPoint[];
  isLoading: boolean;
  onInvestigate: (point: InvestigationPoint) => void;
}

const InvestigationUI: React.FC<InvestigationUIProps> = ({ points, isLoading, onInvestigate }) => {
  const [investigatingId, setInvestigatingId] = useState<string | null>(null);

  const handleClick = (point: InvestigationPoint) => {
    setInvestigatingId(point.id);
    onInvestigate(point);
  };
  
  // Reset investigatingId when points change (e.g., one is removed)
  useEffect(() => {
    if (investigatingId && !points.some(p => p.id === investigatingId)) {
        setInvestigatingId(null);
    }
  }, [points, investigatingId]);

  return (
    <div className="absolute inset-0">
        {points.map((point, index) => {
          const position = hotspotPositions[index % hotspotPositions.length];
          const isCurrentLoading = isLoading && investigatingId === point.id;
          return (
            <button
              key={point.id}
              onClick={() => handleClick(point)}
              disabled={isLoading}
              className="absolute flex items-center gap-2 px-4 py-2 bg-[#1c1a17]/80 border-2 border-[#e4d8b4]/50 rounded-full text-[#e4d8b4] hover:bg-[#e4d8b4] hover:text-[#4a2e1c] hover:border-[#4a2e1c] transition-all duration-300 backdrop-blur-sm shadow-lg animate-pulse hover:animate-none transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-[#e4d8b4]/50 disabled:cursor-wait"
              style={{
                top: position.top,
                left: position.left,
                transform: 'translate(-50%, -50%)',
              }}
            >
              {isCurrentLoading ? <SpinnerIcon className="w-5 h-5 text-[#e4d8b4]" /> : <MagnifyingGlassIcon className="w-5 h-5" />}
              <span>{point.name}</span>
            </button>
          );
        })}
    </div>
);
}

interface DialogueViewProps {
  messages: Message[];
  activeCharacter: string;
  isLoading: boolean;
  onSendMessage: (text: string) => void;
  onEndDialogue: () => void;
}

const DialogueView: React.FC<DialogueViewProps> = ({ messages, activeCharacter, isLoading, onSendMessage, onEndDialogue }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const isYueLinglong = activeCharacter === '岳玲珑';
  const imageSeed = isYueLinglong
    ? 'YueLinglongPortrait' 
    : encodeURIComponent(activeCharacter);
  const characterImageUrl = `https://picsum.photos/seed/${imageSeed}/400/600`;

  // Portrait is always bottom-right. Yue Linglong is just taller.
  const portraitContainerClasses = `absolute bottom-0 right-10 pointer-events-none ${isYueLinglong ? 'h-[85%]' : 'h-3/4'}`;

  // Layout for chat and input. On small screens, add padding to avoid the portrait. On larger screens, the width restriction handles it.
  const chatContainerClasses = 'flex-1 overflow-y-auto p-6 space-y-6 w-full md:w-2/3 pr-40 md:pr-6';
  const inputContainerClasses = 'w-full md:w-2/3 pr-40 md:pr-0';

  return (
    <div className="absolute inset-0 bg-black/60 flex flex-col backdrop-blur-sm z-10">
      <div className={portraitContainerClasses}>
        <img src={characterImageUrl} alt={activeCharacter} className="h-full object-contain" />
      </div>

      <div className={chatContainerClasses}>
        {messages.map((msg, index) => (
          <MessageBubble key={index} message={msg} />
        ))}
         {isLoading && (
            <div className="flex justify-start">
                <div className="flex items-center space-x-2 bg-[#3a3631] px-4 py-2 rounded-lg">
                    <ThreeDotsLoader color="#e4d8b4" />
                    <span className="text-[#e4d8b4] text-sm italic">{activeCharacter}正在思索...</span>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className={inputContainerClasses}>
        <DialogueInput isLoading={isLoading} onSendMessage={onSendMessage} onEndDialogue={onEndDialogue} />
      </div>
    </div>
  );
};

// --- Main GameScreen Component ---

interface GameScreenProps {
  gameState: GameState;
  gamePhase: GamePhase;
  narrative: { speaker: string; content: string };
  dialogueHistory: Message[];
  activeCharacter: string | null;
  isLoading: boolean;
  lastInvestigatedClue: { point: InvestigationPoint; description: string } | null;
  onAdvanceNarrative: () => void;
  onInvestigate: (point: InvestigationPoint) => void;
  onCluePopupClose: () => void;
  onSendMessage: (text: string) => void;
  onEndDialogue: () => void;
}

const GameScreen: React.FC<GameScreenProps> = (props) => {
  const { gameState, gamePhase, narrative, dialogueHistory, activeCharacter, isLoading, lastInvestigatedClue } = props;
  const { onAdvanceNarrative, onInvestigate, onCluePopupClose, onSendMessage, onEndDialogue } = props;

  const bgImageUrl = `https://picsum.photos/seed/${encodeURIComponent(gameState.locationImagePrompt)}/1920/1080`;

  const renderContent = () => {
    const showInvestigationUI = gamePhase === GamePhase.INVESTIGATION && !lastInvestigatedClue;
    
    const popupPointIndex = lastInvestigatedClue 
      ? gameState.investigationPoints.findIndex(p => p.id === lastInvestigatedClue.point.id)
      : -1;
    
    const popupPosition = popupPointIndex !== -1 
      ? hotspotPositions[popupPointIndex % hotspotPositions.length] 
      : { top: '50%', left: '50%' }; // Fallback position

    return (
      <>
        {showInvestigationUI && <InvestigationUI points={gameState.investigationPoints} onInvestigate={onInvestigate} isLoading={isLoading} />}
        
        {lastInvestigatedClue && (
            <CluePopup 
                description={lastInvestigatedClue.description}
                position={popupPosition}
                onClose={onCluePopupClose}
            />
        )}

        {gamePhase === GamePhase.NARRATIVE && !lastInvestigatedClue && (
          <NarrativeBox speaker={narrative.speaker} content={narrative.content} onAdvance={onAdvanceNarrative} />
        )}
        
        {gamePhase === GamePhase.DIALOGUE && activeCharacter && (
            <DialogueView
              messages={dialogueHistory}
              activeCharacter={activeCharacter}
              isLoading={isLoading}
              onSendMessage={onSendMessage}
              onEndDialogue={onEndDialogue}
            />
        )}
      </>
    );
  };

  return (
    <div className="flex-1 relative bg-cover bg-center" style={{ backgroundImage: `url(${bgImageUrl})` }}>
      <div className="absolute inset-0 bg-black/30">
        {renderContent()}
      </div>
    </div>
  );
};

export default GameScreen;