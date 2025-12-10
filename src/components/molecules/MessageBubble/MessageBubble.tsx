import React from 'react';
import { Message } from '../../../services/types';
import { FormattedText } from '../../atoms/FormattedText/FormattedText';
import { MdDelete, MdEdit } from "react-icons/md";
import { TbMessage2Minus } from "react-icons/tb";
interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  senderName?: string;
  isGroupConversation?: boolean;
  className?: string;
  onEditMessage?: (messageId: string, currentContent: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  onReplyMessage?: (messageId: string) => void;
  allMessages?: Message[];
  users?: Array<{ id: string; name: string }>;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwnMessage,
  senderName,
  isGroupConversation = false,
  className = '',
  onEditMessage,
  onDeleteMessage,
  onReplyMessage,
  allMessages = [],
  users = []
}) => {

  const isMessageEditable = (timestamp: string) => {
    const messageTime = new Date(timestamp).getTime();
    const currentTime = new Date().getTime();
    const timeDifference = currentTime - messageTime;
    const fiveMinutes = 5 * 60 * 1000;
    return timeDifference <= fiveMinutes;
  };


  const originalMessage = message.replyTo && allMessages.length > 0
    ? allMessages.find(m => m.id === message.replyTo)
    : null;


  const getReplyPreview = () => {
    if (originalMessage) {
      const originalSender = users.find(u => u.id === originalMessage.senderId);
      const senderName = originalSender?.name || 'Usuario';
      
      if (originalMessage.messageType === 'file' || originalMessage.messageType === 'audio') {
        try {
          const fileData = JSON.parse(originalMessage.content);
          const fileType = originalMessage.messageType === 'audio' ? 'audio' : 'archivo';
          return `${senderName}: Envió un ${fileType}`;
        } catch {
          return `${senderName}: ${originalMessage.content.substring(0, 50)}${originalMessage.content.length > 50 ? '...' : ''}`;
        }
      }
      return `${senderName}: ${originalMessage.content.substring(0, 50)}${originalMessage.content.length > 50 ? '...' : ''}`;
    }

    return message.replyPreview || 'Mensaje eliminado';
  };

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4 px-2 ${className}`}>
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
            {onReplyMessage && (
              <button
                onClick={() => onReplyMessage(message.id)}
                className="text-gray-400 hover:text-green-500 transition-colors p-1"
                title="Responder al mensaje"
              >
               <TbMessage2Minus/>
              </button>
            )}
            {isOwnMessage && message.messageType === 'text' && onEditMessage && onDeleteMessage && isMessageEditable(message.timestamp) && (
              <>
                <button
                  onClick={() => onEditMessage(message.id, message.content)}
                  className="text-gray-400 hover:text-blue-500 transition-colors p-1"
                  title="Editar mensaje"
                >
                  <MdEdit/>
                </button>
                <button
                  onClick={() => onDeleteMessage(message.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors p-1"
                  title="Eliminar mensaje"
                >
                  <MdDelete />
                </button>
              </>
            )}
          </div>
        </div>
        {message.isReply && (
          <div className="max-w-xs text-xs text-gray-500 p-2 rounded-t-lg bg-gray-100 border-l-2 border-gray-400 transition-colors">
            {getReplyPreview()}
          </div>
        )}
        <div className={`max-w-xs lg:max-w-md px-4 py-2 ${message.isReply ? 'rounded-b-lg' : 'rounded-lg'}  ${
          isOwnMessage ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'
        }`}>
          <div className="text-sm">
            <FormattedText text={message.content} />
            {message.isEdited && (
              <div className="text-xs opacity-70 mt-1">
                (editado)
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 