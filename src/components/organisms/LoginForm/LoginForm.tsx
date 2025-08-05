import React, { useState } from 'react';
import { Button } from '../../atoms/Button/Button';
import { Input } from '../../atoms/Input/Input';

interface LoginFormProps {
  onLogin: (userData: {
    id: string;
    name: string;
    email: string;
    roles: string[];
    filials: string[];
  }) => void;
  isLoading?: boolean;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLogin, isLoading = false }) => {
  const [formData, setFormData] = useState({
    id: 'a4c85c56-4f94-4081-b0b2-e5fdd0d43c51',
    name: 'frank',
    email: 'frank@gmail.com',
    roles: 'user',
    filials: 'sucursal1'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin({
      id: formData.id,
      name: formData.name,
      email: formData.email,
      roles: formData.roles.split(',').map(r => r.trim()),
      filials: formData.filials.split(',').map(f => f.trim())
    });
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
          Chat API - Login
        </h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ID de Usuario
            </label>
            <Input
              type="text"
              value={formData.id}
              onChange={(e) => handleChange('id', e.target.value)}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre
            </label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Roles (separados por coma)
            </label>
            <Input
              type="text"
              value={formData.roles}
              onChange={(e) => handleChange('roles', e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filiales (separadas por coma)
            </label>
            <Input
              type="text"
              value={formData.filials}
              onChange={(e) => handleChange('filials', e.target.value)}
            />
          </div>
          
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Conectando...' : 'Conectar al Chat'}
          </Button>
        </form>
      </div>
    </div>
  );
}; 