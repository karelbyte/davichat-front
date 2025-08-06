import React from 'react';
import { Badge } from '../../atoms/Badge/Badge';
import { HiUserGroup } from "react-icons/hi2";
import { Conversation } from '../../../services/api';

interface GroupCardProps {
  group: Conversation;
  unreadCount?: number;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
}

export const GroupCard: React.FC<GroupCardProps> = ({
  group,
  unreadCount = 0,
  isSelected = false,
  onClick,
  className = ''
}) => {
  const participantCount = group.participants?.length || 0;

  return (
    <div 
      className={`p-3 cursor-pointer hover:bg-gray-50 transition-colors mb-2 ${
        isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''
      } ${className}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
            <HiUserGroup/>
          </div>
          <div>
            <div className="font-medium text-gray-800">{group.name || 'Grupo sin nombre'}</div>
            <div className="text-xs text-gray-600">Integrantes ({participantCount})</div>
          </div>
        </div>
        <Badge count={unreadCount} />
      </div>
    </div>
  );
}; 