
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { type Chat } from "@google/genai";
import { type Message, type GameState, GamePhase, Sender, type InvestigationPoint, type CollectedClue } from './types';
import { geminiService } from './services/geminiService';
import CharacterList from './components/CharacterList';
import GameScreen from './components/GameScreen';
import { ScaleLoader } from './components/Loader';
import { GamepadIcon } from './components/icons/Icons';

const App: React.FC = () => {
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [gamePhase, setGamePhase] = useState<GamePhase>(GamePhase.STARTING);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [narrative, setNarrative] = useState({ speaker: '', content: '' });
  const [dialogueHistory, setDialogueHistory] = useState<Message[]>([]);
  const [activeCharacter, setActiveCharacter] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const [collectedClues, setCollectedClues] = useState<CollectedClue[]>([]);
  const [lastInvestigatedClue, setLastInvestigatedClue] = useState<{ point: InvestigationPoint; description: string } | null>(null);

  const isMounted = useRef(true);

  const processAIResponse = useCallback((response: any) => {
    // Don't process if a clue popup is active
    if (lastInvestigatedClue) return;

    setNarrative({ speaker: response.speaker, content: response.narrative });
    setGameState(response.scene);
    setGamePhase(response.gamePhase);
    if (response.gamePhase !== GamePhase.DIALOGUE) {
      setActiveCharacter(null);
    }
  }, [lastInvestigatedClue]);

  const resetGameState = () => {
    setGamePhase(GamePhase.STARTING);
    setGameState(null);
    setDialogueHistory([]);
    setActiveCharacter(null);
    setCollectedClues([]);
    setLastInvestigatedClue(null);
  }

  const startGame = useCallback(async () => {
    if (!isMounted.current) return;
    
    resetGameState();
    setIsLoading(true);
    setError(null);

    try {
      const session = geminiService.startChat();
      setChatSession(session);
      
      const response = await geminiService.sendMessage(session, "游戏开始，请生成开场白和第一个场景。");
      
      if (isMounted.current) {
        processAIResponse(response);
      }
    } catch (err) {
      if (isMounted.current) {
         setError(err instanceof Error ? err.message : '与AI通信时发生未知错误。请检查您的API密钥和网络连接。');
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [processAIResponse]);

  useEffect(() => {
    startGame();
    return () => {
      isMounted.current = false;
    };
  }, [startGame]);

  const sendRequestToAI = useCallback(async (prompt: string, processResponse: boolean = true) => {
    if (!chatSession || !isMounted.current) return null;

    setIsLoading(true);
    setError(null);

    try {
      const response = await geminiService.sendMessage(chatSession, prompt);
      if (isMounted.current && processResponse) {
        processAIResponse(response);
      }
      return response;
    } catch (err) {
      if (isMounted.current) {
        const errorMessage = err instanceof Error ? err.message : '与AI通信时发生未知错误。';
        setError(errorMessage);
      }
      return null;
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [chatSession, processAIResponse]);

  const handleAdvanceNarrative = () => {
    setGamePhase(GamePhase.INVESTIGATION);
  };

  const handleInvestigate = async (point: InvestigationPoint) => {
    const response = await sendRequestToAI(`调查线索：${point.name}。请在narrative中返回此线索的描述，并保持gamePhase为INVESTIGATION。`, false);
    if (response && isMounted.current) {
      setLastInvestigatedClue({ point, description: response.narrative });
    }
  };

  const handleCluePopupClose = () => {
    if (!lastInvestigatedClue) return;
    
    const newClue: CollectedClue = {
        id: lastInvestigatedClue.point.id,
        name: lastInvestigatedClue.point.name,
        description: lastInvestigatedClue.description,
    };
    setCollectedClues(prev => [...prev, newClue]);
    
    setGameState(prev => {
        if (!prev) return null;
        return {
            ...prev,
            investigationPoints: prev.investigationPoints.filter(p => p.id !== lastInvestigatedClue.point.id)
        };
    });
    
    setLastInvestigatedClue(null);
  };

  const handleStartDialogue = (character: string) => {
    setDialogueHistory([]);
    setActiveCharacter(character);
    setGamePhase(GamePhase.DIALOGUE);
    sendRequestToAI(`（系统指令：开始与 ${character} 对话，请生成TA的第一句对话。）`);
  };

  const handleConsultYueLinglong = () => {
    setDialogueHistory([]);
    setActiveCharacter("岳玲珑");
    setGamePhase(GamePhase.DIALOGUE);
    const cluesText = collectedClues.length > 0
        ? `我们目前掌握的线索有：${collectedClues.map(c => c.name).join('、')}。`
        : "我们目前还没有发现任何线索。";
    sendRequestToAI(`（系统指令：我正在向我的搭档岳玲珑请教。${cluesText} 玲珑，依你之见，我们应当如何着手？请生成她的分析和建议。）`);
  };

  const handleSendMessageInDialogue = async (text: string) => {
    if (!activeCharacter) return;
    const userMessage: Message = { sender: Sender.Player, content: text, speaker: '你' };
    setDialogueHistory(prev => [...prev, userMessage]);

    // Send request but DO NOT let it process the response globally,
    // to prevent it from changing the game phase.
    const response = await sendRequestToAI(text, false);

    if (response && isMounted.current) {
        // We only care about the narrative (dialogue content) and speaker here.
        const aiMessage: Message = { sender: Sender.Storyteller, content: response.narrative, speaker: response.speaker };
        setDialogueHistory(prev => [...prev, aiMessage]);
        // We manually ensure the phase stays as DIALOGUE.
        setGamePhase(GamePhase.DIALOGUE);
    }
  };

  const handleEndDialogue = () => {
    setActiveCharacter(null);
    setGamePhase(GamePhase.INVESTIGATION);
    setDialogueHistory([]);
    sendRequestToAI(`（系统指令：结束对话，返回调查阶段。请简单描述一下返回场景后的状态。）`);
  };

  const renderMainContent = () => {
    if (isLoading && gamePhase === GamePhase.STARTING) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center">
          <ScaleLoader color="#e4d8b4" />
          <p className="mt-4 text-[#e4d8b4] text-lg">正在加载案卷...</p>
        </div>
      );
    }
    
    if (gameState) {
      return (
        <GameScreen
          gameState={gameState}
          gamePhase={gamePhase}
          narrative={narrative}
          dialogueHistory={dialogueHistory}
          activeCharacter={activeCharacter}
          isLoading={isLoading}
          lastInvestigatedClue={lastInvestigatedClue}
          onAdvanceNarrative={handleAdvanceNarrative}
          onInvestigate={handleInvestigate}
          onCluePopupClose={handleCluePopupClose}
          onSendMessage={handleSendMessageInDialogue}
          onEndDialogue={handleEndDialogue}
        />
      );
    }
    return null;
  };

  return (
    <div className="flex h-screen w-screen bg-[#2a2723] text-white">
      <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-[#1c1a17] border-r border-[#4a4238] p-4">
        <div className="flex items-center mb-6">
          <h1 className="text-2xl font-bold text-[#e4d8b4]">玲珑府</h1>
        </div>
        {gameState && (
          <CharacterList 
            characters={gameState.characters} 
            location={gameState.location}
            collectedClues={collectedClues}
            onCharacterClick={handleStartDialogue}
            onConsultPartner={handleConsultYueLinglong}
            activeCharacter={activeCharacter}
          />
        )}
        <button 
          onClick={startGame}
          className="mt-auto flex items-center justify-center gap-2 rounded-md bg-[#e4d8b4] text-[#4a2e1c] px-4 py-2 hover:bg-opacity-90 transition-colors duration-200"
        >
          <GamepadIcon className="w-5 h-5" />
          <span>重开新案</span>
        </button>
      </aside>

      <main className="flex-1 flex flex-col h-full bg-[#2a2723]">
        {renderMainContent()}
        {error && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-4xl p-4 bg-red-800/80 text-center text-red-200 backdrop-blur-sm">{error}</div>}
      </main>
    </div>
  );
};

export default App;