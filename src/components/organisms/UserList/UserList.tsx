import React from 'react';
import { UserCard } from '../../molecules/UserCard/UserCard';
import { GroupCard } from '../../molecules/GroupCard/GroupCard';
import { Button } from '../../atoms/Button/Button';
import { User, Conversation } from '../../../services/api';

interface UserListProps {
  users: User[];
  conversations: Conversation[];
  unreadCounts: Record<string, number>;
  groupUnreadCounts: Record<string, number>;
  currentUserId: string;
  onUserClick: (userId: string) => void;
  onGroupClick: (conversation: Conversation) => void;
  onCreateGroup: () => void;
  className?: string;
}

export const UserList: React.FC<UserListProps> = ({
  users,
  conversations,
  unreadCounts,
  groupUnreadCounts,
  currentUserId,
  onUserClick,
  onGroupClick,
  onCreateGroup,
  className = ''
}) => {
  const filteredUsers = users.filter(user => user.id !== currentUserId);
  const groups = conversations.filter(conv => conv.type === 'group');

  return (
    <div className={`w-80 bg-white shadow-lg flex flex-col ${className}`}>
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Chat API</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {filteredUsers.length === 0 && groups.length === 0 ? (
            <div className="text-sm text-gray-500">Cargando usuarios y grupos...</div>
          ) : (
            <>
              {filteredUsers.map(user => (
                <UserCard
                  key={user.id}
                  user={user}
                  unreadCount={unreadCounts[user.id] || 0}
                  onClick={() => onUserClick(user.id)}
                />
              ))}
              
              {groups.map(group => (
                <GroupCard
                  key={group.id}
                  group={group}
                  unreadCount={groupUnreadCounts[group.id] || 0}
                  onClick={() => onGroupClick(group)}
                />
              ))}
            </>
          )}
        </div>
      </div>

      <div className="p-4 border-t border-gray-200">
        <Button
          variant="success"
          onClick={onCreateGroup}
          className="w-full"
        >
          Crear Grupo
        </Button>
      </div>
    </div>
  );
}; 