import React, { useState, useEffect, useRef } from 'react';
import { UserList } from '../../organisms/UserList/UserList';
import { MessageInput } from '../../organisms/MessageInput/MessageInput';
import { TypingIndicator } from '../../atoms/TypingIndicator/TypingIndicator';
import { MessageBubble } from '../../molecules/MessageBubble/MessageBubble';
import { FileMessage } from '../../molecules/FileMessage/FileMessage';
import { Button } from '../../atoms/Button/Button';
import { IconButton } from '../../atoms/IconButton/IconButton';
import { Modal } from '../../atoms/Modal/Modal';
import { CreateGroupForm } from '../../molecules/CreateGroupForm/CreateGroupForm';
import { AddParticipantsForm } from '../../molecules/AddParticipantsForm/AddParticipantsForm';
import { Header } from '../../organisms/Header/Header';
import { useSocket } from '../../../hooks/useSocket';
import { useChat } from '../../../hooks/useChat';
import { User, Conversation, Message } from '../../../services/api';
import { AiOutlineUserAdd } from "react-icons/ai";

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
  } = useChat(currentUser || null, socketService);

  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showAddParticipantsModal, setShowAddParticipantsModal] = useState(false);

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
    <div className="h-screen flex flex-col">
      <Header currentUser={currentUser} onLogout={handleLogout} />
      
      <div className="flex flex-1 overflow-hidden">
        <UserList
          users={users}
          conversations={conversations}
          unreadCounts={unreadCounts}
          groupUnreadCounts={groupUnreadCounts}
          currentUserId={currentUser.id}
          currentConversation={currentConversation}
          onUserClick={handleUserClick}
          onGroupClick={handleGroupClick}
          onCreateGroup={handleCreateGroup}
        />

        <div className="flex-1 flex flex-col">
          {currentConversation ? (
            <>
              <div className="bg-white border-b border-gray-200 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg text-gray-600">
                      {currentConversation.type === 'private' 
                        ? `Conversando con ${users.find(u => 
                            u.id !== currentUser.id && 
                            currentConversation.participants.includes(u.id)
                          )?.name || 'Usuario'}`
                        : `Conversando en el grupo ${currentConversation.name || 'Sin nombre'}`
                      }
                    </h3>
                  </div>
                  <div className="flex space-x-2">
                    {currentConversation.type === 'group' && (
                      <IconButton
                        onClick={() => setShowAddParticipantsModal(true)}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        <AiOutlineUserAdd className="w-5 h-5" />
                      </IconButton>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-4">
                  {messages.map(renderMessage)}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              <div className="bg-white border-t border-gray-200">
                <TypingIndicator
                  isVisible={typingUsers.length > 0}
                  typingUsers={typingUsers}
                />
                <MessageInput
                  onSendMessage={sendMessage}
                  onStartTyping={startTyping}
                  onStopTyping={stopTyping}
                />
              </div>
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
        <Modal
          isOpen={showCreateGroupModal}
          onClose={() => setShowCreateGroupModal(false)}
        >
          <CreateGroupForm
            users={users}
            currentUserId={currentUser.id}
            onSubmit={(data) => {
              createGroup(data);
              setShowCreateGroupModal(false);
            }}
            onCancel={() => setShowCreateGroupModal(false)}
          />
        </Modal>
      )}

      {showAddParticipantsModal && currentConversation && (
        <Modal
          isOpen={showAddParticipantsModal}
          onClose={() => setShowAddParticipantsModal(false)}
        >
          <AddParticipantsForm
            users={users}
            currentUserId={currentUser.id}
            currentConversation={currentConversation}
            onSubmit={(participants) => {
              participants.forEach(userId => {
                addUserToGroup(userId);
              });
              setShowAddParticipantsModal(false);
            }}
            onCancel={() => setShowAddParticipantsModal(false)}
          />
        </Modal>
      )}
    </div>
  );
}; 