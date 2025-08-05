import React from 'react';
import { Badge } from '../../atoms/Badge/Badge';

interface Group {
  id: string;
  name: string;
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
      className={`p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors border-blue-200 bg-blue-50 mb-2 ${className}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div>
            <div className="font-medium text-gray-800">👥 {group.name}</div>
            <div className="text-sm text-gray-600">{group.description || 'Grupo'}</div>
          </div>
          <Badge count={unreadCount} />
        </div>
      </div>
    </div>
  );
}; 