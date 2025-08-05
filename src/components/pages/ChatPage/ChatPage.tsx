import React, { useState, useEffect, useRef } from 'react';
import { UserList } from '../../organisms/UserList/UserList';
import { MessageInput } from '../../organisms/MessageInput/MessageInput';
import { TypingIndicator } from '../../atoms/TypingIndicator/TypingIndicator';
import { MessageBubble } from '../../molecules/MessageBubble/MessageBubble';
import { FileMessage } from '../../molecules/FileMessage/FileMessage';
import { Button } from '../../atoms/Button/Button';
import { useSocket } from '../../../hooks/useSocket';
import { useChat } from '../../../hooks/useChat';
import { User, Conversation, Message } from '../../../services/api';

interface ChatPageProps {
  currentUser?: User;
}

export const ChatPage: React.FC<ChatPageProps> = ({ currentUser }) => {
  const { getSocketService } = useSocket(currentUser?.id || null);
  const socketService = getSocketService();
  
  const {
    users,
    conversations,
    currentConversation,
    messages,
    unreadCounts,
    groupUnreadCounts,
    typingUsers,
    isLoading,
    startPrivateChat,
    joinConversation,
    sendMessage,
    startTyping,
    stopTyping,
    createGroup,
    addUserToGroup,
    loadUsersAndConversations
  } = useChat(currentUser, socketService);

  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showAddParticipantsModal, setShowAddParticipantsModal] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedUsersToAdd, setSelectedUsersToAdd] = useState<string[]>([]);
  const [groupFormData, setGroupFormData] = useState({
    name: '',
    description: ''
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleLogout = () => {
    if (socketService) {
      socketService.disconnect();
    }
    window.location.reload();
  };

  const handleUserClick = (userId: string) => {
    startPrivateChat(userId);
  };

  const handleGroupClick = (conversation: Conversation) => {
    joinConversation(conversation);
  };

  const handleCreateGroup = () => {
    setShowCreateGroupModal(true);
  };

  const handleGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUsers.length === 0) return;

    createGroup({
      name: groupFormData.name,
      description: groupFormData.description,
      participants: selectedUsers
    });

    setShowCreateGroupModal(false);
    setGroupFormData({ name: '', description: '' });
    setSelectedUsers([]);
  };

  const handleAddParticipants = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUsersToAdd.length === 0) return;

    selectedUsersToAdd.forEach(userId => {
      addUserToGroup(userId);
    });

    setShowAddParticipantsModal(false);
    setSelectedUsersToAdd([]);
  };

  const renderMessage = (message: Message) => {
    const isOwnMessage = message.senderId === currentUser?.id;
    const isGroupConversation = currentConversation?.type === 'group';
    const senderName = isGroupConversation && !isOwnMessage 
      ? users.find(u => u.id === message.senderId)?.name || 'Usuario'
      : undefined;

    if (message.messageType === 'file' || message.messageType === 'audio') {
      try {
        const fileData = JSON.parse(message.content);
        return (
          <div key={message.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}>
            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
              isOwnMessage ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'
            }`}>
              {isGroupConversation && !isOwnMessage && (
                <div className={`text-xs font-medium ${
                  isOwnMessage ? 'text-blue-100' : 'text-gray-600'
                } mb-1`}>
                  {senderName} • {new Date(message.timestamp).toLocaleTimeString()}
                </div>
              )}
              <FileMessage fileData={fileData} isOwnMessage={isOwnMessage} />
              {(!isGroupConversation || isOwnMessage) && (
                <div className={`text-xs ${
                  isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                } mt-1`}>
                  {new Date(message.timestamp).toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>
        );
      } catch (error) {
        return (
          <MessageBubble
            key={message.id}
            message={message}
            isOwnMessage={isOwnMessage}
            senderName={senderName}
            isGroupConversation={isGroupConversation}
          />
        );
      }
    }

    return (
      <MessageBubble
        key={message.id}
        message={message}
        isOwnMessage={isOwnMessage}
        senderName={senderName}
        isGroupConversation={isGroupConversation}
      />
    );
  };

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex h-screen">
        <UserList
          users={users}
          conversations={conversations}
          unreadCounts={unreadCounts}
          groupUnreadCounts={groupUnreadCounts}
          currentUserId={currentUser.id}
          onUserClick={handleUserClick}
          onGroupClick={handleGroupClick}
          onCreateGroup={handleCreateGroup}
        />

        <div className="flex-1 flex flex-col">
          {currentConversation ? (
            <>
              <div className="bg-white shadow-sm border-b border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      {currentConversation.name || 'Chat privado'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {currentConversation.type === 'group' ? 'Grupo' : 'Conversación privada'}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    {currentConversation.type === 'group' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setShowAddParticipantsModal(true)}
                      >
                        Añadir Participante
                      </Button>
                    )}
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={handleLogout}
                    >
                      Salir
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-4">
                  {messages.map(renderMessage)}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              <TypingIndicator
                isVisible={typingUsers.length > 0}
                typingUsers={typingUsers}
              />

              <MessageInput
                onSendMessage={sendMessage}
                onStartTyping={startTyping}
                onStopTyping={stopTyping}
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  Bienvenido al Chat
                </h3>
                <p className="text-gray-600">
                  Selecciona un usuario para iniciar una conversación o crea un grupo
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {showCreateGroupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Crear Grupo</h3>
            <form onSubmit={handleGroupSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Grupo
                </label>
                <input
                  type="text"
                  value={groupFormData.name}
                  onChange={(e) => setGroupFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  value={groupFormData.description}
                  onChange={(e) => setGroupFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Participantes
                </label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {users
                    .filter(user => user.id !== currentUser.id)
                    .map(user => (
                      <div key={user.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`user_${user.id}`}
                          value={user.id}
                          checked={selectedUsers.includes(user.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUsers(prev => [...prev, user.id]);
                            } else {
                              setSelectedUsers(prev => prev.filter(id => id !== user.id));
                            }
                          }}
                          className="rounded"
                        />
                        <label htmlFor={`user_${user.id}`} className="text-sm">
                          {user.name}
                        </label>
                      </div>
                    ))}
                </div>
              </div>
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowCreateGroupModal(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={selectedUsers.length === 0}
                  className="flex-1"
                >
                  Crear Grupo
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddParticipantsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Añadir Participantes</h3>
            <form onSubmit={handleAddParticipants} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Usuarios disponibles
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {users
                    .filter(user => user.id !== currentUser.id)
                    .filter(user => !currentConversation?.participants?.includes(user.id))
                    .map(user => (
                      <div key={user.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`add_user_${user.id}`}
                          value={user.id}
                          checked={selectedUsersToAdd.includes(user.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUsersToAdd(prev => [...prev, user.id]);
                            } else {
                              setSelectedUsersToAdd(prev => prev.filter(id => id !== user.id));
                            }
                          }}
                          className="rounded"
                        />
                        <label htmlFor={`add_user_${user.id}`} className="text-sm">
                          {user.name}
                        </label>
                      </div>
                    ))}
                </div>
              </div>
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowAddParticipantsModal(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={selectedUsersToAdd.length === 0}
                  className="flex-1"
                >
                  Añadir Seleccionados
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}; 