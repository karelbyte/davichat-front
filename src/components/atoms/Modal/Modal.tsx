import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  className = ''
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0" onClick={onClose}></div>
      <div className={`relative bg-white rounded-lg p-6 w-96 shadow-xl border border-gray-200 ${className}`}>
        {children}
      </div>
    </div>
  );
}; 