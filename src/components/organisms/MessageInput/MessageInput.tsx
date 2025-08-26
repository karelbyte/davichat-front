import React, { useState, useRef, useEffect } from 'react';
import { AiOutlinePaperClip } from "react-icons/ai";
import { Input } from '../../atoms/Input/Input';
import { IconButton } from '../../atoms/IconButton/IconButton';
import { EmojiPicker } from '../../atoms/EmojiPicker/EmojiPicker';
import { FileUploadModal } from '../../atoms/FileUploadModal/FileUploadModal';
import { apiService } from '../../../services/api';
import { PiMicrophone } from "react-icons/pi";
import { useAuth } from '../../../contexts/auth.context';

interface MessageInputProps {
  onSendMessage: (content: string, messageType: 'text' | 'file' | 'audio') => void;
  onStartTyping: () => void;
  onStopTyping: () => void;
  currentConversation: { id: string; type: 'private' | 'group'; name?: string } | null; // Para validar que existe una conversación activa
  disabled?: boolean;
  className?: string;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  onStartTyping,
  onStopTyping,
  currentConversation,
  disabled = false,
  className = ''
}) => {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showFileUploadModal, setShowFileUploadModal] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSendMessage = () => {
    if (!message.trim() || disabled) return;
    
    onSendMessage(message.trim(), 'text');
    setMessage('');
    onStopTyping();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    onStartTyping();
    
    typingTimeoutRef.current = setTimeout(() => {
      onStopTyping();
    }, 3000);
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessage(prev => prev + emoji);
  };

  const handleFileUpload = async (file: File) => {
    const selectedConversationId = localStorage.getItem('selectedConversationId');
    if (!selectedConversationId) {
      return;
    }
    
    console.log('File upload using localStorage ID:', selectedConversationId);
    
    // Subir archivo con los parámetros necesarios
    // El backend se encarga de emitir el mensaje automáticamente
    try {
      await apiService.uploadFile(file, selectedConversationId, user?.id || '');
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      setIsRecording(true);

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await uploadAudioFile(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const uploadAudioFile = async (audioBlob: Blob) => {
    const selectedConversationId = localStorage.getItem('selectedConversationId');
    if (!selectedConversationId) {
      return;
    }
    
    try {
      const file = new File([audioBlob], 'audio.wav', { type: 'audio/wav' });
      // Subir audio con los parámetros necesarios
      // El backend se encarga de emitir el mensaje automáticamente
      await apiService.uploadFile(file, selectedConversationId, user?.id || '');
    } catch (error) {
      console.error('Error uploading audio:', error);
    }
  };

  const handleRecordingClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className={`bg-whit border-gray-200 p-4 ${className}`}>
      <div className="flex space-x-2">
        <Input
          type="text"
          placeholder="Escribe un mensaje..."
          value={message}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          disabled={disabled || isUploading}
          className="flex-1"
        />
        
        <IconButton
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          disabled={disabled || isUploading}
          className="text-gray-600 hover:text-gray-800"
        >
          😊
        </IconButton>
        
        <IconButton
          onClick={() => setShowFileUploadModal(true)}
          disabled={disabled || isUploading}
          className="text-gray-600 hover:text-gray-800"
        >
          <AiOutlinePaperClip/>
        </IconButton>
        
        <IconButton
          onClick={handleRecordingClick}
          disabled={disabled || isUploading}
          className={isRecording ? "text-red-600 hover:text-red-800" : "text-gray-600 hover:text-gray-800"}
        >
          {isRecording ? '⏹️' : <PiMicrophone/>}
        </IconButton>
        
        <IconButton
          onClick={handleSendMessage}
          disabled={disabled || !message.trim() || isUploading}
          className={!message.trim() ? "text-gray-400" : "text-blue-600 hover:text-blue-800"}
        >
          ➤
        </IconButton>
      </div>
      
      <EmojiPicker
        isOpen={showEmojiPicker}
        onClose={() => setShowEmojiPicker(false)}
        onEmojiSelect={handleEmojiSelect}
      />
      
      <FileUploadModal
        isOpen={showFileUploadModal}
        onClose={() => setShowFileUploadModal(false)}
        onFileUpload={handleFileUpload}
      />
    </div>
  );
}; 