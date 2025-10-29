
import React, { useState } from 'react';
import { PaperPlaneIcon } from './icons/Icons';

interface DialogueInputProps {
  isLoading: boolean;
  onSendMessage: (text: string) => void;
  onEndDialogue: () => void;
}

const DialogueInput: React.FC<DialogueInputProps> = ({ isLoading, onSendMessage, onEndDialogue }) => {
  const [userInput, setUserInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;
    onSendMessage(userInput);
    setUserInput('');
  };

  return (
    <div className="p-4 bg-black/30">
        <div className="flex items-center gap-3">
          <button
            onClick={onEndDialogue}
            disabled={isLoading}
            className="px-4 py-2 bg-[#4a4238] text-[#e4d8b4] rounded-lg hover:bg-opacity-80 transition-colors duration-200"
          >
            结束对话
          </button>
          <form onSubmit={handleSubmit} className="flex-1 flex items-center gap-3">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="你想问什么..."
              disabled={isLoading}
              className="flex-1 p-3 bg-[#2a2723]/80 border border-[#4a4238] rounded-lg text-[#e4d8b4] placeholder-[#a89d86] focus:outline-none focus:ring-2 focus:ring-[#e4d8b4] transition-all duration-200"
              autoFocus
            />
            <button
              type="submit"
              disabled={isLoading || !userInput.trim()}
              className="p-3 bg-[#e4d8b4] text-[#4a2e1c] rounded-full disabled:bg-[#a89d86] disabled:cursor-not-allowed hover:bg-opacity-90 transition-colors duration-200"
            >
              <PaperPlaneIcon className="w-6 h-6" />
            </button>
          </form>
        </div>
    </div>
  );
};

export default DialogueInput;
