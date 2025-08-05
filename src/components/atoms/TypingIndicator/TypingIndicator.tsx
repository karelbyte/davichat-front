import React from 'react';

interface TypingIndicatorProps {
  isVisible: boolean;
  typingUsers: string[];
  className?: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  isVisible,
  typingUsers,
  className = ''
}) => {
  if (!isVisible || typingUsers.length === 0) return null;
  
  const getTypingText = () => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0]} está escribiendo...`;
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0]} y ${typingUsers[1]} están escribiendo...`;
    } else {
      return `${typingUsers[0]} y otros están escribiendo...`;
    }
  };
  
  return (
    <div className={`bg-gray-50 border-t border-gray-200 p-2 ${className}`}>
      <div className="text-sm text-gray-600 italic">
        <span>{getTypingText()}</span>
      </div>
    </div>
  );
}; 