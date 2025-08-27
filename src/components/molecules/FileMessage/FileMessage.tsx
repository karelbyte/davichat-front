import React from 'react';
import { CiSaveDown2 } from "react-icons/ci";
import { MdDelete } from 'react-icons/md';
interface FileData {
  fileUrl: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  thumbnailUrl?: string;
}

interface FileMessageProps {
  fileData: FileData;
  isOwnMessage: boolean;
  className?: string;
  onDeleteMessage?: (messageId: string) => void;
  onReplyMessage?: (messageId: string) => void;
  messageId?: string;
  timestamp?: string;
  isReply?: boolean;
  replyPreview?: string;
}

export const FileMessage: React.FC<FileMessageProps> = ({
  fileData,
  isOwnMessage,
  className = '',
  onDeleteMessage,
  onReplyMessage,
  messageId,
  timestamp,
  isReply = false,
  replyPreview
}) => {
  // Función para verificar si el mensaje se puede eliminar (dentro de 5 minutos)
  const isMessageEditable = (timestamp: string) => {
    const messageTime = new Date(timestamp).getTime();
    const currentTime = new Date().getTime();
    const timeDifference = currentTime - messageTime;
    const fiveMinutes = 5 * 60 * 1000; // 5 minutos en milisegundos
    return timeDifference <= fiveMinutes;
  };
  // FileMessage rendering with data
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isImage = fileData.fileType.startsWith('image/');
  const isAudio = fileData.fileType.startsWith('audio/');
  const fileSize = formatFileSize(fileData.fileSize);

  if (isImage) {
    return (
      <div className={`mb-2 ${className}`}>
        <div className="relative">
          {isReply && replyPreview && (
            <div className="text-xs text-gray-500 mb-2 p-2 bg-gray-100 rounded cursor-pointer hover:bg-gray-200 transition-colors">
              ↩️ {replyPreview}
            </div>
          )}
          <img 
            src={fileData.fileUrl} 
            alt={fileData.fileName} 
            className="max-w-full h-auto rounded"
          />
        </div>
        <div className={`text-xs text-gray-500`}>
          📎 {fileData.fileName} ({fileSize})
        </div>
      </div>
    );
  }

  if (isAudio) {
    return (
      <div className={`mb-2 ${className}`}>
        <div className="flex flex-col">
          {isReply && replyPreview && (
            <div className="text-xs text-gray-500 mb-2 p-2 bg-gray-100 rounded cursor-pointer hover:bg-gray-200 transition-colors">
              ↩️ {replyPreview}
            </div>
          )}
          <div className="flex p-3 md:w-60 lg:w-80">
            <audio controls className="w-full h-10 rounded">
              <source src={fileData.fileUrl} type={fileData.fileType} />
              Tu navegador no soporta el elemento de audio.
            </audio>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`mb-2 ${className}`}>
      <div className="flex flex-col">
        {isReply && replyPreview && (
          <div className="text-xs text-gray-500 mb-2 p-2 bg-gray-100 rounded cursor-pointer hover:bg-gray-200 transition-colors">
            ↩️ {replyPreview}
          </div>
        )}
        <div className="flex items-center space-x-2 p-2 rounded">
          <div className="text-2xl">📄</div>
          <div className="flex-1">
            <div className="text-sm font-medium">{fileData.fileName}</div>
            <div className={`text-xs ${isOwnMessage ? 'text-blue-100' : 'text-gray-500'}`}>
              {fileSize}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 