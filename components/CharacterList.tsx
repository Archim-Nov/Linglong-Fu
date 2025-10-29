import React, { useState } from 'react';
import { UserIcon, LocationIcon, BoxIcon, ChevronDownIcon, FanIcon } from './icons/Icons';
import { type CollectedClue } from '../types';

interface ClueItemProps {
  clue: CollectedClue;
}

const ClueItem: React.FC<ClueItemProps> = ({ clue }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    return (
        <div className="bg-[#3a3631]/70 rounded-md overflow-hidden transition-all duration-300">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full text-left p-3 flex justify-between items-center hover:bg-[#4a4238]/50 focus:outline-none"
            >
                <p className="font-semibold text-[#e4d8b4]">{clue.name}</p>
                <ChevronDownIcon 
                    className={`w-4 h-4 text-[#a89d86] transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} 
                />
            </button>
            {isExpanded && (
                <div className="px-3 pb-3 border-t border-[#4a4238]/50">
                    <p className="text-sm text-[#a89d86] mt-2 leading-relaxed">{clue.description}</p>
                </div>
            )}
        </div>
    );
};

interface ClueBoxProps {
  clues: CollectedClue[];
}

const ClueBox: React.FC<ClueBoxProps> = ({ clues }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="mt-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left text-lg font-semibold text-[#c8bba1] flex items-center justify-between gap-2 mb-3 focus:outline-none"
      >
        <div className="flex items-center gap-2">
            <BoxIcon className="w-5 h-5" />
            <span>线索盒</span>
        </div>
        <ChevronDownIcon 
          className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} 
        />
      </button>
      {isExpanded && (
        clues.length > 0 ? (
          <div className="space-y-2 pl-1 max-h-48 overflow-y-auto pr-2">
            {clues.map((clue) => (
              <ClueItem key={clue.id} clue={clue} />
            ))}
          </div>
        ) : (
          <p className="text-[#a89d86] italic pl-1">暂无线索。</p>
        )
      )}
    </div>
  );
};


interface CharacterListProps {
  characters: string[];
  location: string;
  collectedClues: CollectedClue[];
  onCharacterClick: (name: string) => void;
  onConsultPartner: () => void;
  activeCharacter: string | null;
}

const CharacterList: React.FC<CharacterListProps> = ({ characters, location, collectedClues, onCharacterClick, onConsultPartner, activeCharacter }) => {
  return (
    <div className="flex-1 flex flex-col overflow-y-hidden">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-[#c8bba1] flex items-center gap-2 mb-2">
            <LocationIcon className="w-5 h-5"/>
            <span>当前场景</span>
        </h2>
        <p className="text-xl font-bold text-[#e4d8b4]">{location}</p>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold text-[#c8bba1] flex items-center gap-2 mb-3">
          <FanIcon className="w-5 h-5" />
          <span>我的搭档</span>
        </h2>
        <button 
            onClick={onConsultPartner}
            disabled={!!activeCharacter}
            className={`w-full text-left p-3 rounded-md transition-colors duration-200 text-[#e4d8b4] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#1c1a17] focus:ring-[#e4d8b4]
              ${activeCharacter === '岳玲珑' 
                ? 'bg-[#e4d8b4] text-black font-bold' 
                : 'bg-[#3a3631]/70 hover:bg-[#4a4238] disabled:bg-[#3a3631]/40 disabled:cursor-not-allowed'
              }`}
          >
            岳玲珑
          </button>
      </div>
      
      <div className="flex-1 overflow-y-auto pr-2">
        <div>
          <h2 className="text-lg font-semibold text-[#c8bba1] flex items-center gap-2 mb-3">
              <UserIcon className="w-5 h-5" />
              <span>在场人物</span>
          </h2>
          {characters.length > 0 ? (
            <ul className="space-y-2">
              {characters.map((character, index) => (
                <li key={index}>
                  <button 
                    onClick={() => onCharacterClick(character)}
                    disabled={!!activeCharacter}
                    className={`w-full text-left p-3 rounded-md transition-colors duration-200 text-[#e4d8b4] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#1c1a17] focus:ring-[#e4d8b4]
                      ${activeCharacter === character 
                        ? 'bg-[#e4d8b4] text-black font-bold' 
                        : 'bg-[#3a3631]/70 hover:bg-[#4a4238] disabled:bg-[#3a3631]/40 disabled:cursor-not-allowed'
                      }`}
                  >
                    {character}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[#a89d86] italic">此处暂无他人。</p>
          )}
        </div>

        <ClueBox clues={collectedClues} />

      </div>
    </div>
  );
};

export default CharacterList;