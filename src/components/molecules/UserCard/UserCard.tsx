import React from 'react';
import { Badge } from '../../atoms/Badge/Badge';

interface User {
  id: string;
  name: string;
  email: string;
  isOnline?: boolean;
}

interface UserCardProps {
  user: User;
  unreadCount?: number;
  onClick?: () => void;
  className?: string;
}

export const UserCard: React.FC<UserCardProps> = ({
  user,
  unreadCount = 0,
  onClick,
  className = ''
}) => {
  return (
    <div 
      className={`p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
        user.isOnline ? 'border-green-200 bg-green-50' : 'border-gray-200'
      } mb-2 ${className}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div>
            <div className="font-medium text-gray-800">👤 {user.name}</div>
            <div className="text-sm text-gray-600">{user.email}</div>
          </div>
          <Badge count={unreadCount} />
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${
            user.isOnline ? 'bg-green-500' : 'bg-gray-400'
          }`}></div>
        </div>
      </div>
    </div>
  );
}; 