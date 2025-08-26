import React from 'react';
import { CiSaveDown2 } from "react-icons/ci";
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
}

export const FileMessage: React.FC<FileMessageProps> = ({
  fileData,
  isOwnMessage,
  className = ''
}) => {
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
          <img 
            src={fileData.fileUrl} 
            alt={fileData.fileName} 
            className="max-w-full h-auto rounded"
          />
          <a 
            href={fileData.fileUrl} 
            target="_blank" 
            className="absolute top-2 right-2  bg-opacity-50 text-black p-1 rounded hover:bg-opacity-70"
          >
            <CiSaveDown2/>
          </a>
        </div>
        <div className={`text-xs text-gray-500`}>
          📎 {fileData.fileName} ({fileSize})
        </div>
      </div>
    );
  }

  if (isAudio) {
    return (
      <div className="flex p-3 md:w-60 lg:w-80">
        <audio controls className="w-full h-10 rounded">
          <source src={fileData.fileUrl} type={fileData.fileType} />
          Tu navegador no soporta el elemento de audio.
        </audio>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2 p-2 rounded">
      <div className="text-2xl">📄</div>
      <div className="flex-1">
        <div className="text-sm font-medium">{fileData.fileName}</div>
        <div className={`text-xs ${isOwnMessage ? 'text-blue-100' : 'text-gray-500'}`}>
          {fileSize}
        </div>
      </div>
      <a 
        href={fileData.fileUrl} 
        target="_blank" 
        className="text-blue-500 hover:text-blue-700"
      >
       <CiSaveDown2/>
      </a>
    </div>
  );
}; 