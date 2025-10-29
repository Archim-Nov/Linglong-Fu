
import React from 'react';
import { type Message, Sender } from '../types';
import { UserCircleIcon, QuillIcon } from './icons/Icons';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isPlayer = message.sender === Sender.Player;

  const wrapperClasses = isPlayer ? 'flex justify-end' : 'flex justify-start';
  const bubbleClasses = isPlayer 
    ? 'bg-blue-900/50 text-blue-100' 
    : 'bg-[#3a3631]/80 text-[#e4d8b4]';
  
  const icon = isPlayer 
    ? <UserCircleIcon className="w-8 h-8 text-blue-300" /> 
    : <QuillIcon className="w-8 h-8 text-[#c8bba1]" />;

  const contentWithLineBreaks = message.content.split('\n').map((line, index, array) => (
    <React.Fragment key={index}>
      {line}
      {index < array.length - 1 && <br />}
    </React.Fragment>
  ));
  
  return (
    <div className={`${wrapperClasses} items-start gap-3`}>
      {!isPlayer && <div className="flex-shrink-0 mt-1">{icon}</div>}
      <div className="flex flex-col">
        {message.speaker && !isPlayer && <p className="text-sm text-[#a89d86] mb-1 ml-3">{message.speaker}</p>}
        <div className={`max-w-xl lg:max-w-3xl px-5 py-3 rounded-xl shadow-lg ${bubbleClasses}`}>
          <p className="text-base leading-relaxed">{contentWithLineBreaks}</p>
        </div>
      </div>
      {isPlayer && <div className="flex-shrink-0 mt-1">{icon}</div>}
    </div>
  );
};

export default MessageBubble;
