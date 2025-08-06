import React from 'react';

interface BadgeProps {
  count: number;
  variant?: 'red' | 'blue' | 'green';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  count,
  variant = 'red',
  size = 'sm',
  className = ''
}) => {
  if (count === 0) return null;
  
  const variantClasses = {
    red: 'bg-red-500 text-white',
    blue: 'bg-blue-500 text-white',
    green: 'bg-green-500 text-white'
  };
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5'
  };
  
  return (
    <span className={`${variantClasses[variant]} ${sizeClasses[size]} rounded-full ${className}`}>
      {count}
    </span>
  );
}; 