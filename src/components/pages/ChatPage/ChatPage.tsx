import React, { useState, useEffect, useRef } from 'react';
import { UserList } from '../../organisms/UserList/UserList';
import { MessageInput } from '../../organisms/MessageInput/MessageInput';
import { TypingIndicator } from '../../atoms/TypingIndicator/TypingIndicator';
import { MessageBubble } from '../../molecules/MessageBubble/MessageBubble';
import { FileMessage } from '../../molecules/FileMessage/FileMessage';
import { IconButton } from '../../atoms/IconButton/IconButton';
import { Modal } from '../../atoms/Modal/Modal';
import { EditMessageModal } from '../../atoms/EditMessageModal/EditMessageModal';
import { DeleteMessageModal } from '../../atoms/DeleteMessageModal/DeleteMessageModal';
import { CreateGroupForm } from '../../molecules/CreateGroupForm/CreateGroupForm';
import { AddParticipantsForm } from '../../molecules/AddParticipantsForm/AddParticipantsForm';
import { Header } from '../../organisms/Header/Header';
import { useSocket } from '../../../hooks/useSocket';
import { useChat } from '../../../hooks/useChat';
import { useAuth } from '../../../contexts/auth.context';
import { User, Conversation } from '../../../services/api';
import { Message } from '../../../services/types';
import { AiOutlineUserAdd } from "react-icons/ai";
import { CiSaveDown2 } from "react-icons/ci";
import { MdDelete } from 'react-icons/md';
import { TbMessage2Minus } from "react-icons/tb";
import { toast } from 'react-toastify';

interface ChatPageProps {
  currentUser?: User;
}

export const ChatPage: React.FC<ChatPageProps> = ({ currentUser }) => {
  const { getSocketService } = useSocket(currentUser || null);
  const socketService = getSocketService();
  const { logout } = useAuth();

  // Función para truncar emails con más de un punto después de la arroba (igual que en UserCard)
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
  
  const {
    users,
    conversations,
    currentConversation,
    messages,
    unreadCounts,
    groupUnreadCounts,
    typingUsers,
    isLoading,
    error,
    startPrivateChat,
    joinConversation,
    sendMessage,
    startTyping,
    stopTyping,
    createGroup,
    addUserToGroup,
    editMessage,
    deleteMessage,
    sendReply,
    retryLoad,
    requestNotificationPermission,
    browserNotificationsEnabled,
  } = useChat(currentUser || null, socketService);

  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showAddParticipantsModal, setShowAddParticipantsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingMessage, setEditingMessage] = useState<{ id: string; content: string } | null>(null);
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<{ id: string; content: string } | null>(null);
  const [showGroupMembersModal, setShowGroupMembersModal] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState<Array<{
    senderId: string;
    senderName: string;
    conversationId: string;
    messageContent: string;
    timestamp: string;
  }>>([]);

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
    logout();
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

  const handleEditMessage = (messageId: string, currentContent: string) => {
    setEditingMessage({ id: messageId, content: currentContent });
    setShowEditModal(true);
  };

  const handleDeleteMessage = (messageId: string) => {
    setDeletingMessageId(messageId);
    setShowDeleteModal(true);
  };

  const handleReplyMessage = (messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (message) {
      let replyContent = message.content;
      
      // Si es un mensaje de archivo, mostrar información del usuario + tipo de archivo
      if (message.messageType === 'file' || message.messageType === 'audio') {
        try {
          const fileData = JSON.parse(message.content);
          const senderName = users.find(u => u.id === message.senderId)?.name || 'Usuario';
          const fileType = message.messageType === 'audio' ? 'audio' : 'archivo';
          replyContent = `${senderName} envió un ${fileType}`;
        } catch (error) {
          // Si falla el parsing, usar el contenido original
          replyContent = message.content;
        }
      }
      
      setReplyingTo({ id: messageId, content: replyContent });
    }
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  const handleSendReply = (content: string) => {
    if (replyingTo && content.trim()) {
      sendReply(replyingTo.id, content.trim());
      setReplyingTo(null);
    }
  };

  const handleSaveEdit = (newContent: string) => {
    if (editingMessage) {
      editMessage(editingMessage.id, newContent);
    }
  };

  const handleConfirmDelete = () => {
    if (deletingMessageId) {
      deleteMessage(deletingMessageId);
    }
  };

  const handleNotificationClick = (conversationId: string, senderId: string) => {
    const conversation = conversations.find(c => c.id === conversationId);
    if (conversation) {
      joinConversation(conversation);
    } else {
      startPrivateChat(senderId);
    }
    
    setUnreadNotifications(prev => 
      prev.filter(notification => 
        !(notification.conversationId === conversationId && notification.senderId === senderId)
      )
    );
  };

  useEffect(() => {
    const notifications: Array<{
      senderId: string;
      senderName: string;
      conversationId: string;
      messageContent: string;
      timestamp: string;
    }> = [];

    Object.entries(unreadCounts).forEach(([userId, count]) => {
      if (count > 0) {
        const user = users.find(u => u.id === userId);
        if (user) {
          notifications.push({
            senderId: userId,
            senderName: user.name,
            conversationId: userId,
            messageContent: `${count} mensaje${count > 1 ? 's' : ''} no leído${count > 1 ? 's' : ''}`,
            timestamp: new Date().toISOString()
          });
        }
      }
    });

    Object.entries(groupUnreadCounts).forEach(([conversationId, count]) => {
      if (count > 0) {
        const conversation = conversations.find(c => c.id === conversationId);
        if (conversation) {
          notifications.push({
            senderId: conversation.createdBy || '',
            senderName: conversation.name || 'Grupo',
            conversationId: conversationId,
            messageContent: `${count} mensaje${count > 1 ? 's' : ''} no leído${count > 1 ? 's' : ''}`,
            timestamp: new Date().toISOString()
          });
        }
      }
    });

    setUnreadNotifications(notifications);
  }, [unreadCounts, groupUnreadCounts, users, conversations]);

  const renderMessage = (message: Message) => {
            // Rendering message
    const isOwnMessage = message.senderId === currentUser?.id;
    const isGroupConversation = currentConversation?.type === 'group';
    const senderName = isGroupConversation && !isOwnMessage 
      ? users.find(u => u.id === message.senderId)?.name || 'Usuario'
      : undefined;

    // Función para verificar si el mensaje se puede editar/eliminar (dentro de 5 minutos)
    const isMessageEditable = (timestamp: string) => {
      const messageTime = new Date(timestamp).getTime();
      const currentTime = new Date().getTime();
      const timeDifference = currentTime - messageTime;
      const fiveMinutes = 5 * 60 * 1000; // 5 minutos en milisegundos
      return timeDifference <= fiveMinutes;
    };

        if (message.messageType === 'file') {
      try {
        const fileData = JSON.parse(message.content);
        return (
          <div key={message.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4 px-2`}>
            <div className="flex flex-col">
                              <div className={`flex items-center gap-2 mb-1 ${
            isOwnMessage ? 'justify-end' : 'justify-start'
          }`}>
          {isGroupConversation && !isOwnMessage && (
            <div className="text-xs font-medium text-gray-600">
              {senderName}
            </div>
          )}
                      <div className="text-xs text-gray-500">
              {new Date(message.timestamp).toLocaleTimeString()}
            </div>
            <div className="flex items-center gap-1 ml-2">
              <button
                onClick={() => handleReplyMessage(message.id)}
                className="text-gray-400 hover:text-green-500 transition-colors p-1"
                title="Responder al mensaje"
              >
                <TbMessage2Minus/>
              </button>
              <a 
                href={fileData.fileUrl} 
                target="_blank" 
                className="text-gray-400 hover:text-blue-500 transition-colors p-1"
                title="Descargar archivo"
              >
                <CiSaveDown2/>
              </a>
              {isOwnMessage && isMessageEditable(message.timestamp) && (
                <button
                  onClick={() => handleDeleteMessage(message.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors p-1"
                  title="Eliminar mensaje"
                >
                 <MdDelete />
                </button>
              )}
            </div>
        </div>
              <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                isOwnMessage ? 'border border-blue-600 text-gray-800' : 'border border-gray-200 text-gray-800'
              }`}>
                                                  <FileMessage 
                    fileData={fileData} 
                    isOwnMessage={isOwnMessage} 
                    onDeleteMessage={handleDeleteMessage}
                    onReplyMessage={handleReplyMessage}
                    messageId={message.id}
                    timestamp={message.timestamp}
                    isReply={message.isReply}
                    replyPreview={message.replyPreview}
                  />
              </div>
            </div>
          </div>
        );
      } catch (error) {
        console.log(error);
        // Si falla el parsing, mostrar el mensaje como texto
        return (
          <MessageBubble
            key={message.id}
            message={message}
            isOwnMessage={isOwnMessage}
            senderName={senderName}
            isGroupConversation={isGroupConversation}
            onEditMessage={handleEditMessage}
            onDeleteMessage={handleDeleteMessage}
            onReplyMessage={handleReplyMessage}
          />
        );
      }
    }

    if (message.messageType === 'audio') {
      try {
        const fileData = JSON.parse(message.content);
        return (
          <div key={message.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4 px-2`}>
            <div className="flex flex-col">
              <div className={`flex items-center gap-2 mb-1 ${
                isOwnMessage ? 'justify-end' : 'justify-start'
              }`}>
                {isGroupConversation && !isOwnMessage && (
                  <div className="text-xs font-medium text-gray-600">
                    {senderName}
                  </div>
                )}
                <div className="text-xs text-gray-500">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <button
                    onClick={() => handleReplyMessage(message.id)}
                    className="text-gray-400 hover:text-green-500 transition-colors p-1"
                    title="Responder al mensaje"
                  >
                    <TbMessage2Minus/>
                  </button>
                  {isOwnMessage && isMessageEditable(message.timestamp) && (
                    <button
                      onClick={() => handleDeleteMessage(message.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors p-1"
                      title="Eliminar mensaje"
                    >
                      <MdDelete />
                    </button>
                  )}
                </div>
              </div>
              <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                isOwnMessage ? 'border border-blue-600 text-gray-800' : 'border border-gray-200 text-gray-800'
              }`}>
                                 <FileMessage 
                   fileData={fileData} 
                   isOwnMessage={isOwnMessage} 
                   onDeleteMessage={handleDeleteMessage}
                   onReplyMessage={handleReplyMessage}
                   messageId={message.id}
                   timestamp={message.timestamp}
                   isReply={message.isReply}
                   replyPreview={message.replyPreview}
                 />
               </div>
             </div>
           </div>
         );
       } catch (error) {
         // Si falla el parsing, mostrar el mensaje como texto
        console.log(error);
        return (
          <MessageBubble
            key={message.id}
            message={message}
            isOwnMessage={isOwnMessage}
            senderName={senderName}
            isGroupConversation={isGroupConversation}
            onEditMessage={handleEditMessage}
            onDeleteMessage={handleDeleteMessage}
            onReplyMessage={handleReplyMessage}
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
         onEditMessage={handleEditMessage}
         onDeleteMessage={handleDeleteMessage}
         onReplyMessage={handleReplyMessage}
       />
    );
  };

  if (!currentUser) return null;

  return (
    <div className="h-screen flex flex-col">
             <Header 
         currentUser={currentUser} 
         onLogout={handleLogout}
         unreadMessages={unreadNotifications}
         onNotificationClick={handleNotificationClick}
         onRequestNotificationPermission={requestNotificationPermission}
         browserNotificationsEnabled={browserNotificationsEnabled}
       />
      
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
           onGroupDoubleClick={(group) => setShowGroupMembersModal(true)}
           onCreateGroup={handleCreateGroup}
           isLoading={isLoading}
           error={error}
           onRetry={retryLoad}
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
                        : (
                          <button
                            onClick={() => setShowGroupMembersModal(true)}
                            className="hover:text-blue-600 transition-colors cursor-pointer"
                            title="Ver miembros del grupo"
                          >
                            Conversando en el grupo {currentConversation.name || 'Sin nombre'}
                          </button>
                        )
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

              <div className="flex-1 overflow-y-auto">
                <div className="space-y-4 lg:mx-[300px] xl:mx-[400px] h-full">
                  {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full min-h-[400px]">
                      <div className="text-center">
                        <h3 className="text-lg font-medium text-gray-600 mb-2">
                          {currentConversation.type === 'private' 
                            ? `Este es el inicio de tu conversación con ${users.find(u => 
                                u.id !== currentUser.id && 
                                currentConversation.participants.includes(u.id)
                              )?.name || 'Usuario'}`
                            : `Este es el inicio de tu conversación con el grupo ${currentConversation.name || 'Sin nombre'}`
                          }
                        </h3>
                        <p className="text-sm text-gray-500">
                          Envía un mensaje para comenzar a chatear
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="py-12"> 
                      {messages.map(renderMessage)}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>
              </div>

                             <div className="bg-white border-t border-gray-200">
                 {replyingTo && (
                   <div className="bg-blue-50 border-t border-blue-200 p-3">
                     <div className="flex items-center justify-between">
                       <div className="text-sm text-blue-800">
                         <span className="font-medium">Respondiendo a:</span> {replyingTo.content.substring(0, 50)}{replyingTo.content.length > 50 ? '...' : ''}
                       </div>
                       <button
                         onClick={handleCancelReply}
                         className="text-blue-600 hover:text-blue-800 text-sm"
                       >
                         ✕ Cancelar
                       </button>
                     </div>
                   </div>
                 )}
                 <TypingIndicator
                   isVisible={typingUsers.length > 0}
                   typingUsers={typingUsers.map(userId => 
                     users.find(u => u.id === userId)?.name || 'Usuario'
                   )}
                 />
                 <MessageInput
                   onSendMessage={replyingTo ? handleSendReply : sendMessage}
                   onStartTyping={startTyping}
                   onStopTyping={stopTyping}
                   currentConversation={currentConversation}
                   placeholder={replyingTo ? `Responder a: ${replyingTo.content.substring(0, 30)}...` : "Escribe un mensaje..."}
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
              /* if (participants.length > 1) { 
                toast.success('Se añadieron los usuarios al grupo, se enviaron notificaciones a los participantes');
               } else {
                toast.success('Se añadió el usuario al grupo, se envió notificación al participante');
               }*/
             }}
             onCancel={() => setShowAddParticipantsModal(false)}
           />
         </Modal>
       )}

       {showEditModal && editingMessage && (
         <EditMessageModal
           isOpen={showEditModal}
           onClose={() => {
             setShowEditModal(false);
             setEditingMessage(null);
           }}
           currentContent={editingMessage.content}
           onSave={handleSaveEdit}
         />
       )}

       {showDeleteModal && deletingMessageId && (
         <DeleteMessageModal
           isOpen={showDeleteModal}
           onClose={() => {
             setShowDeleteModal(false);
             setDeletingMessageId(null);
           }}
           onConfirm={handleConfirmDelete}
         />
       )}

       {showGroupMembersModal && currentConversation && (
         <Modal
           isOpen={showGroupMembersModal}
           onClose={() => setShowGroupMembersModal(false)}
         >
           <div className="p-6">
             <h2 className="text-xl font-semibold text-gray-800 mb-4">
               Miembros del Grupo: {currentConversation.name}
             </h2>
             
                           <div className="max-h-96 overflow-y-auto space-y-3 pr-2">
                {currentConversation.participants.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-400 mb-2">
                      <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 font-medium">No hay participantes en el grupo</p>
                    <p className="text-sm text-gray-400 mt-1">Usa el botón + para agregar usuarios</p>
                  </div>
                ) : (
                  currentConversation.participants.map((participantId) => {
                    const participant = users.find(u => u.id === participantId);
                    return (
                      <div key={participantId} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="relative">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                            {participant?.name?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                            participant?.isOnline ? 'bg-green-500' : 'bg-gray-400'
                          }`}></div>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">
                            {participant?.name || 'Usuario desconocido'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {participant?.email ? truncateEmail(participant.email) : 'Sin email'}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

                           <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowGroupMembersModal(false)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                >
                  Cerrar
                </button>
              </div>
           </div>
         </Modal>
       )}
     </div>
   );
 }; 