import React from 'react';
import { Badge } from '../../atoms/Badge/Badge';
import { HiUserGroup } from "react-icons/hi2";

interface Group {
  id: string;
  name?: string;
  description?: string;
  type: 'group';
}

interface GroupCardProps {
  group: Group;
  unreadCount?: number;
  onClick?: () => void;
  className?: string;
}

export const GroupCard: React.FC<GroupCardProps> = ({
  group,
  unreadCount = 0,
  onClick,
  className = ''
}) => {
  return (
    <div 
      className={`p-3 cursor-pointer hover:bg-gray-50 transition-colors mb-2 ${className}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
            <HiUserGroup/>
          </div>
          <div>
            <div className="font-medium text-gray-800">{group.name || 'Grupo sin nombre'}</div>
            <div className="text-sm text-gray-600">{group.description || 'Grupo'}</div>
          </div>
          <Badge count={unreadCount} />
        </div>
      </div>
    </div>
  );
}; 