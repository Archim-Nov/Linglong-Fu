
import React from 'react';

interface LoaderProps {
  color?: string;
}

export const ScaleLoader: React.FC<LoaderProps> = ({ color = '#000' }) => (
  <div className="flex space-x-2">
    <div className="w-4 h-4 rounded-full animate-pulse" style={{ backgroundColor: color, animationDelay: '0s' }}></div>
    <div className="w-4 h-4 rounded-full animate-pulse" style={{ backgroundColor: color, animationDelay: '0.2s' }}></div>
    <div className="w-4 h-4 rounded-full animate-pulse" style={{ backgroundColor: color, animationDelay: '0.4s' }}></div>
  </div>
);


export const ThreeDotsLoader: React.FC<LoaderProps> = ({ color = '#000' }) => (
  <div className="flex space-x-1.5">
    <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: color, animationDelay: '0s' }}></div>
    <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: color, animationDelay: '0.2s' }}></div>
    <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: color, animationDelay: '0.4s' }}></div>
  </div>
);
