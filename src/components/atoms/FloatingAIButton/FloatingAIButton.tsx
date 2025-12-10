import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

interface FloatingAIButtonProps {
  onClick?: () => void;
}

export const FloatingAIButton: React.FC<FloatingAIButtonProps> = ({ onClick }) => {
  const [isJumping, setIsJumping] = useState(false);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      toast.info('En desarrollo', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setIsJumping(true);
      setTimeout(() => {
        setIsJumping(false);
      }, 600);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <button
      onClick={handleClick}
      className={`fixed bottom-26 right-6 w-16 h-16 rounded-full border border-red-400 bg-transparent shadow-md shadow-red-400 hover:shadow-red-600 transition-all duration-300 flex items-center justify-center z-50 ${
        isJumping ? 'animate-bounce' : ''
      }`}
      title="Asistente IA"
    >
      <img 
        src="/ia.png" 
        alt="Asistente IA" 
        className="w-10 h-10 object-contain"
      />
    </button>
  );
};
