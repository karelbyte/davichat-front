import React from 'react';
import { Badge } from '../../atoms/Badge/Badge';
import { Avatar } from '../../atoms/Avatar/Avatar';

interface User {
  id: string;
  name: string;
  email: string;
  isOnline?: boolean;
}

interface UserCardProps {
  user: User;
  unreadCount?: number;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
}

// Función para truncar emails con más de un punto después de la arroba
const truncateEmail = (email: string): string => {
  const atIndex = email.indexOf('@');
  if (atIndex === -1) return email;
  
  const domain = email.substring(atIndex + 1);
  const dotsAfterAt = (domain.match(/\./g) || []).length;
  
  if (dotsAfterAt > 1) {
    const firstDotIndex = domain.indexOf('.');
    return email.substring(0, atIndex + 1 + firstDotIndex + 1) + '...';
  }
  
  return email;
};

export const UserCard: React.FC<UserCardProps> = ({
  user,
  unreadCount = 0,
  isSelected = false,
  onClick,
  className = ''
}) => {
  return (
    <div 
      className={`p-3 cursor-pointer hover:bg-gray-50 transition-colors mb-2 ${
        isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''
      } ${className}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Avatar name={user.name} size="md" />
            <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
              user.isOnline ? 'bg-green-500' : 'bg-gray-400'
            }`}></div>
          </div>
          <div>
            <div className="font-medium text-gray-800">{user.name}</div>
            <div className="text-xs text-gray-600">{truncateEmail(user.email)}</div>
          </div>
        </div>
        <Badge count={unreadCount} />
      </div>
    </div>
  );
}; 