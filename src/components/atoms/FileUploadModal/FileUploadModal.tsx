import React, { useState, useRef, useCallback } from 'react';
import { Modal } from '../Modal/Modal';
import { Button } from '../Button/Button';
import { IconButton } from '../IconButton/IconButton';
import { AiOutlinePaperClip, AiOutlineClose } from "react-icons/ai";
import { apiService } from '../../../services/api';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFileUpload: (fileData: any) => void;
  className?: string;
}

export const FileUploadModal: React.FC<FileUploadModalProps> = ({
  isOpen,
  onClose,
  onFileUpload,
  className = ''
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
  }, []);

  const validateFile = (file: File): boolean => {
    const maxSize = 10 * 1024 * 1024;
    const allowedTypes = [
      'image/',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'audio/',
      'video/'
    ];

    if (file.size > maxSize) {
      console.error('File too large:', file.name);
      return false;
    }

    const isValidType = allowedTypes.some(type => file.type.startsWith(type));
    if (!isValidType) {
      console.error('Invalid file type:', file.name);
      return false;
    }

    return true;
  };

  const handleFiles = async (files: File[]) => {
    if (files.length === 0) return;

    const validFiles = files.filter(validateFile);
    if (validFiles.length === 0) return;

    setIsUploading(true);
    try {
      for (const file of validFiles) {
        const fileData = await apiService.uploadFile(file);
        onFileUpload(fileData);
        setUploadedFiles(prev => [...prev, file]);
      }
    } catch (error) {
      console.error('Error uploading files:', error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleClose = () => {
    setUploadedFiles([]);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className={className}>
      <div className="w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Subir archivos</h3>
          <IconButton
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <AiOutlineClose />
          </IconButton>
        </div>

        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragOver 
              ? 'border-blue-400 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <AiOutlinePaperClip className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              Arrastra y suelta archivos aquí, o
            </p>
            <Button
              onClick={handleBrowseClick}
              disabled={isUploading}
              className="text-blue-600 hover:text-blue-800 underline"
            >
              busca archivos
            </Button>
          </div>

          <p className="text-xs text-gray-500 mt-2">
            PNG, JPG, PDF, DOC, DOCX, TXT, MP3, MP4 hasta 10MB
          </p>
        </div>

        {isUploading && (
          <div className="mt-4 text-center">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <p className="text-sm text-gray-600 mt-2">Subiendo archivos...</p>
          </div>
        )}

        {uploadedFiles.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Archivos subidos:</h4>
            <div className="space-y-2">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm text-gray-700 truncate">{file.name}</span>
                  <span className="text-xs text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          multiple
          accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,audio/*,video/*"
          onChange={handleFileSelect}
        />
      </div>
    </Modal>
  );
};
