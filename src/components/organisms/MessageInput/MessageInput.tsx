import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../../atoms/Button/Button';
import { Input } from '../../atoms/Input/Input';
import { apiService } from '../../../services/api';

interface MessageInputProps {
  onSendMessage: (content: string, messageType: 'text' | 'file' | 'audio') => void;
  onStartTyping: () => void;
  onStopTyping: () => void;
  disabled?: boolean;
  className?: string;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  onStartTyping,
  onStopTyping,
  disabled = false,
  className = ''
}) => {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fileData = await apiService.uploadFile(file);
      onSendMessage(JSON.stringify(fileData), 'file');
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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
    setIsUploading(true);
    try {
      const file = new File([audioBlob], 'audio.wav', { type: 'audio/wav' });
      const fileData = await apiService.uploadFile(file);
      onSendMessage(JSON.stringify(fileData), 'audio');
    } catch (error) {
      console.error('Error uploading audio:', error);
    } finally {
      setIsUploading(false);
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
        
        <Button
          variant="secondary"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading}
        >
          📎
        </Button>
        
        <Button
          variant={isRecording ? 'danger' : 'secondary'}
          onClick={handleRecordingClick}
          disabled={disabled || isUploading}
        >
          {isRecording ? '⏹️' : '🎤'}
        </Button>
        
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,audio/*"
          onChange={handleFileUpload}
        />
        
        <Button
          onClick={handleSendMessage}
          disabled={disabled || !message.trim() || isUploading}
        >
          {isUploading ? 'Enviando...' : 'Enviar'}
        </Button>
      </div>
    </div>
  );
}; 