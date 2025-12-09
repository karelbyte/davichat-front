import React from 'react';
import { Modal } from '../Modal/Modal';

interface LeaveGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  groupName?: string;
}

export const LeaveGroupModal: React.FC<LeaveGroupModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  groupName
}) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="px-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Abandonar Grupo
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          ¿Estás seguro de que quieres abandonar el grupo {groupName ? `"${groupName}"` : ''}? 
          Tus mensajes anteriores permanecerán visibles, pero ya no recibirás nuevos mensajes del grupo.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Abandonar Grupo
          </button>
        </div>
      </div>
    </Modal>
  );
};

