import React, { useState, useMemo, useRef, useEffect } from 'react';
import { UserCard } from '../../molecules/UserCard/UserCard';
import { GroupCard } from '../../molecules/GroupCard/GroupCard';
import { IconButton } from '../../atoms/IconButton/IconButton';
import { SearchInput } from '../../atoms/SearchInput/SearchInput';
import { AiOutlineUsergroupAdd } from "react-icons/ai";
import { User, Conversation } from '../../../services/api';

interface UserListProps {
  users: User[];
  conversations: Conversation[];
  unreadCounts: Record<string, number>;
  groupUnreadCounts: Record<string, number>;
  currentUserId: string;
  currentConversation: Conversation | null;
  onUserClick: (userId: string) => void;
  onGroupClick: (conversation: Conversation) => void;
  onGroupDoubleClick?: (conversation: Conversation) => void;
  onCreateGroup: () => void;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  className?: string;
}

export const UserList: React.FC<UserListProps> = ({
  users,
  conversations,
  unreadCounts,
  groupUnreadCounts,
  currentUserId,
  currentConversation,
  onUserClick,
  onGroupClick,
  onGroupDoubleClick,
  onCreateGroup,
  isLoading = false,
  error,
  onRetry,
  className = ''
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const selectedElementRef = useRef<HTMLDivElement>(null);
  
  const filteredUsers = users.filter(user => user.id !== currentUserId);
  const groups = conversations.filter(conv => conv.type === 'group');

  const filteredResults = useMemo(() => {
    if (!searchTerm.trim()) {
      return {
        users: filteredUsers,
        groups: groups
      };
    }

    const term = searchTerm.toLowerCase();
    
    const filteredUsersResult = users.filter(user => 
      user.id !== currentUserId && 
      (user.name.toLowerCase().includes(term) || 
       user.email.toLowerCase().includes(term))
    );

    const filteredGroupsResult = groups.filter(group =>
      group.name?.toLowerCase().includes(term) ||
      group.description?.toLowerCase().includes(term)
    );

    return {
      users: filteredUsersResult,
      groups: filteredGroupsResult
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, users, groups, currentUserId]);

  const isUserSelected = (userId: string) => {
    return currentConversation?.type === 'private' && 
           currentConversation.participants.includes(userId);
  };

  const isGroupSelected = (groupId: string) => {
    return currentConversation?.id === groupId;
  };


  useEffect(() => {
    if (selectedElementRef.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const element = selectedElementRef.current;
      
      const containerRect = container.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();
      
     
      const isAbove = elementRect.top < containerRect.top;
      const isBelow = elementRect.bottom > containerRect.bottom;
      
      if (isAbove || isBelow) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }
  }, [currentConversation]);

  const handleUserClick = (userId: string) => {
    onUserClick(userId);
    setSearchTerm('');
  };

  const handleGroupClick = (conversation: Conversation) => {
    onGroupClick(conversation);
    setSearchTerm('');
  };

  return (
    <div className={`w-80 bg-white border-r flex flex-col ${className}`}>
      <div className="p-2 border-gray-200">
        <div className="flex items-center space-x-2">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Buscar usuarios y grupos..."
            className="flex-1"
          />
          <IconButton
            size="md"
            onClick={onCreateGroup}
            className="text-gray-600 hover:text-gray-800"
          >
            <AiOutlineUsergroupAdd className="w-5 h-5" />
          </IconButton>
        </div>
      </div>

      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
        <div className="space-y-2">
          {isLoading ? (
            <div className="text-sm text-gray-500 p-4 text-center">
              Cargando usuarios y grupos...
            </div>
          ) : error ? (
            <div className="text-sm text-red-500 p-4 text-center">
              <div className="mb-3">{error}</div>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  Reintentar
                </button>
              )}
            </div>
          ) : filteredResults.users.length === 0 && filteredResults.groups.length === 0 ? (
            <div className="text-sm text-gray-500 p-4 text-center">
              {searchTerm.trim() ? 'No se encontraron resultados' : 'No hay usuarios conectados ni grupos disponibles.'}
            </div>
          ) : (
            <>
              {filteredResults.users.map(user => (
                <div
                  key={user.id}
                  ref={isUserSelected(user.id) ? selectedElementRef : null}
                >
                  <UserCard
                    user={user}
                    unreadCount={unreadCounts[user.id] || 0}
                    isSelected={isUserSelected(user.id)}
                    onClick={() => handleUserClick(user.id)}
                  />
                </div>
              ))}
              
              {filteredResults.groups.map(group => (
                <div
                  key={group.id}
                  ref={isGroupSelected(group.id) ? selectedElementRef : null}
                >
                  <GroupCard
                    group={group}
                    unreadCount={groupUnreadCounts[group.id] || 0}
                    isSelected={isGroupSelected(group.id)}
                    onClick={() => handleGroupClick(group)}
                    onDoubleClick={() => onGroupDoubleClick?.(group)}
                  />
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}; 