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
  lastMessageTimestamps?: Record<string, string>;
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
  className = '',
  lastMessageTimestamps = {}
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const selectedElementRef = useRef<HTMLDivElement>(null);
  
  const filteredUsers = users.filter(user => user.id !== currentUserId);
  const groups = conversations.filter(conv => conv.type === 'group');
  
  const getLastMessageTimestamp = (id: string): number => {
    const timestamp = lastMessageTimestamps[id];
    if (timestamp) {
      return new Date(timestamp).getTime();
    }
    return 0;
  };
  
  type ListItem = 
    | { type: 'user'; data: User }
    | { type: 'group'; data: Conversation };


  const sortedCombinedList = useMemo(() => {
    const items: ListItem[] = [
      ...filteredUsers.map(user => ({ type: 'user' as const, data: user })),
      ...groups.map(group => ({ type: 'group' as const, data: group }))
    ];

    return items.sort((a, b) => {
      const timestampA = getLastMessageTimestamp(a.data.id);
      const timestampB = getLastMessageTimestamp(b.data.id);
      
   
      if (timestampA > 0 && timestampB > 0) {
        return timestampB - timestampA;
      }
      
      if (timestampA > 0) return -1;
      if (timestampB > 0) return 1;
      
      if (a.type === 'user' && b.type === 'user') {
        return a.data.name.localeCompare(b.data.name);
      }
      if (a.type === 'group' && b.type === 'group') {
        const dateA = new Date(a.data.updatedAt || a.data.createdAt).getTime();
        const dateB = new Date(b.data.updatedAt || b.data.createdAt).getTime();
        return dateB - dateA;
      }
      
      return a.type === 'user' ? -1 : 1;
    });
  }, [filteredUsers, groups, lastMessageTimestamps]);


  const filteredResults = useMemo(() => {
    if (!searchTerm.trim()) {
      return sortedCombinedList;
    }

    const term = searchTerm.toLowerCase();
    
    return sortedCombinedList.filter(item => {
      if (item.type === 'user') {
        return item.data.name.toLowerCase().includes(term) || 
               item.data.email.toLowerCase().includes(term);
      } else {
        return item.data.name?.toLowerCase().includes(term) ||
               item.data.description?.toLowerCase().includes(term);
      }
    });
  }, [searchTerm, sortedCombinedList]);

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
          ) : filteredResults.length === 0 ? (
            <div className="text-sm text-gray-500 p-4 text-center">
              {searchTerm.trim() ? 'No se encontraron resultados' : 'No hay usuarios conectados ni grupos disponibles.'}
            </div>
          ) : (
            <>
              {filteredResults.map(item => {
                if (item.type === 'user') {
                  return (
                    <div
                      key={item.data.id}
                      ref={isUserSelected(item.data.id) ? selectedElementRef : null}
                    >
                      <UserCard
                        user={item.data}
                        unreadCount={unreadCounts[item.data.id] || 0}
                        isSelected={isUserSelected(item.data.id)}
                        onClick={() => handleUserClick(item.data.id)}
                      />
                    </div>
                  );
                } else {
                  return (
                    <div
                      key={item.data.id}
                      ref={isGroupSelected(item.data.id) ? selectedElementRef : null}
                    >
                      <GroupCard
                        group={item.data}
                        unreadCount={groupUnreadCounts[item.data.id] || 0}
                        isSelected={isGroupSelected(item.data.id)}
                        onClick={() => handleGroupClick(item.data)}
                        onDoubleClick={() => onGroupDoubleClick?.(item.data)}
                      />
                    </div>
                  );
                }
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}; 