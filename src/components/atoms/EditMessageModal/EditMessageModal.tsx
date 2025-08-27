import React, { useState, useEffect } from 'react';
import { Modal } from '../Modal/Modal';

interface EditMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentContent: string;
  onSave: (newContent: string) => void;
}

export const EditMessageModal: React.FC<EditMessageModalProps> = ({
  isOpen,
  onClose,
  currentContent,
  onSave
}) => {
  const [content, setContent] = useState(currentContent);

  useEffect(() => {
    setContent(currentContent);
  }, [currentContent]);

  const handleSave = () => {
    if (content.trim() && content !== currentContent) {
      onSave(content.trim());
      onClose();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="px-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Editar Mensaje
        </h3>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyPress={handleKeyPress}
          className="w-full h-32 p-3 border text-black border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          placeholder="Escribe tu mensaje..."
          autoFocus
        />
        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!content.trim() || content === currentContent}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Guardar
          </button>
        </div>
      </div>
    </Modal>
  );
};
