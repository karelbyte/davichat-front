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

  // Animación de saltito cada 2 minutos
  useEffect(() => {
    const interval = setInterval(() => {
      setIsJumping(true);
      
      // Resetear la animación después de 600ms
      setTimeout(() => {
        setIsJumping(false);
      }, 600);
    }, 30000); // 2 minutos = 120,000ms

    // Limpiar el interval al desmontar el componente
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
