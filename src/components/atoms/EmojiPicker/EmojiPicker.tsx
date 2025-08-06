import React from 'react';

interface EmojiPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onEmojiSelect: (emoji: string) => void;
  className?: string;
}

const commonEmojis = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
  '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
  '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
  '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
  '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬',
  '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗',
  '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😯', '😦', '😧',
  '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢',
  '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '💩', '👻', '💀',
  '☠️', '👽', '👾', '🤖', '😺', '😸', '😹', '😻', '😼', '😽',
  '🙀', '😿', '😾', '🙈', '🙉', '🙊', '👶', '👧', '🧒', '👦',
  '👩', '🧑', '👨', '👵', '🧓', '👴', '👮', '🕵️', '👷', '👸',
  '🤴', '👳', '👲', '🧕', '🤵', '👰', '🤰', '🤱', '👼', '🎅',
  '🤶', '🧙', '🧚', '🧛', '🧜', '🧝', '🧞', '🧟', '🧌', '👹',
  '👺', '🤡', '💐', '🌸', '💮', '🏵️', '🌹', '🥀', '🌺', '🌻',
  '🌼', '🌷', '🌱', '🌲', '🌳', '🌴', '🌵', '🌾', '🌿', '☘️',
  '🍀', '🍁', '🍂', '🍃', '🍄', '🌰', '🦠', '🦴', '🦵', '🦶',
  '🦷', '🦴', '🦴', '🦴', '🦴', '🦴', '🦴', '🦴', '🦴', '🦴'
];

export const EmojiPicker: React.FC<EmojiPickerProps> = ({
  isOpen,
  onClose,
  onEmojiSelect,
}) => {
  if (!isOpen) return null;

  const handleEmojiClick = (emoji: string) => {
    onEmojiSelect(emoji);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div className="absolute bottom-20 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-3 max-w-xs">
        <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto">
          {commonEmojis.map((emoji, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                handleEmojiClick(emoji);
              }}
              className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded text-lg transition-colors"
              title={emoji}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}; 