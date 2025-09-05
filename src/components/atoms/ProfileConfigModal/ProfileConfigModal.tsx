import React, { useState, useEffect } from 'react';
import { User } from '../../../services/api';
import { Modal } from '../Modal/Modal';
import { Button } from '../Button/Button';
import { Input } from '../Input/Input';
import { toast } from 'react-toastify';

interface ProfileConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onUpdateProfile: (data: { name: string; email: string; avatar?: string }) => void;
}

export const ProfileConfigModal: React.FC<ProfileConfigModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateProfile
}) => {
  const [formData, setFormData] = useState({
    name: currentUser.name,
    email: currentUser.email,
    avatar: currentUser.avatar || ''
  });
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Limpiar la URL de previsualización cuando se cierre el modal
  useEffect(() => {
    if (!isOpen) {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      setSelectedFile(null);
    }
  }, [isOpen, previewUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    
    try {
      let avatarUrl = formData.avatar;
      
      // Si hay un archivo seleccionado, subirlo primero
      if (selectedFile) {
        const uploadFormData = new FormData();
        uploadFormData.append('avatar', selectedFile);

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${currentUser.id}/avatar`, {
          method: 'POST',
          body: uploadFormData
        });

        if (!response.ok) {
          throw new Error('Error al subir avatar');
        }

        const data = await response.json();
        avatarUrl = data.avatar;
      }
      
      // Actualizar el perfil con la nueva información
      await onUpdateProfile({
        ...formData,
        avatar: avatarUrl
      });
      
      onClose();
    } catch (error) {
      toast.error('Error al actualizar el perfil');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAvatarUpload = (file: File) => {
    if (!file) return;
    
    // Solo previsualizar la imagen, no subirla aún
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleAvatarDelete = async () => {
    try {
      const response = await fetch(`/api/users/${currentUser.id}/avatar`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Error al eliminar avatar');
      }

      setFormData(prev => ({ ...prev, avatar: '' }));
      toast.success('Avatar eliminado correctamente');
    } catch (error) {
      toast.error('Error al eliminar avatar');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-auto">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Configuración de Perfil</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar Section */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Avatar Preview"
                  className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
                />
              ) : formData.avatar ? (
                <img
                  src={formData.avatar}
                  alt="Avatar"
                  className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl font-medium">
                  {currentUser.name.split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2)}
                </div>
              )}
            </div>
            
            <div className="flex space-x-2">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleAvatarUpload(file);
                }}
                className="hidden"
                id="avatar-upload"
                disabled={isUploading}
              />
              <label 
                htmlFor="avatar-upload" 
                className={`cursor-pointer font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors px-3 py-1.5 text-sm ${
                  isUploading 
                    ? 'opacity-50 cursor-not-allowed bg-gray-500 text-white' 
                    : 'bg-gray-500 text-white hover:bg-gray-600 focus:ring-gray-500'
                }`}
              >
                {isUploading ? 'Subiendo...' : 'Cambiar Avatar'}
              </label>
              
              {formData.avatar && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleAvatarDelete}
                  disabled={isUploading}
                >
                  Eliminar
                </Button>
              )}
            </div>
          </div>

          {/* Form Fields */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre
            </label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Correo Electrónico
            </label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              required
            />
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isUploading}
            >
              Guardar Cambios
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
