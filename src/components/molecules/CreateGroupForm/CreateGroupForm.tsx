import React, { useState } from 'react';
import { Button } from '../../atoms/Button/Button';
import { Input } from '../../atoms/Input/Input';
import { SearchInput } from '../../atoms/SearchInput/SearchInput';
import { User } from '../../../services/api';

interface CreateGroupFormProps {
  users: User[];
  currentUserId: string;
  onSubmit: (data: { name: string; description: string; participants: string[] }) => void;
  onCancel: () => void;
}

export const CreateGroupForm: React.FC<CreateGroupFormProps> = ({
  users,
  currentUserId,
  onSubmit,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUsers.length === 0) return;

    onSubmit({
      name: formData.name,
      description: formData.description.substring(0, 50),
      participants: selectedUsers
    });
  };

  const filteredUsers = users
    .filter(user => user.id !== currentUserId)
    .filter(user => 
      searchTerm === '' || 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-700">Crear Grupo</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nombre del Grupo
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
            Descripción
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 border text-black border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none overflow-y-auto"
            style={{ height: '80px', minHeight: '80px', maxHeight: '80px' }}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Participantes
          </label>
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Buscar usuarios..."
            className="mb-3"
          />
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {filteredUsers.map(user => (
              <div key={user.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`user_${user.id}`}
                  value={user.id}
                  checked={selectedUsers.includes(user.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedUsers(prev => [...prev, user.id]);
                    } else {
                      setSelectedUsers(prev => prev.filter(id => id !== user.id));
                    }
                  }}
                  className="rounded"
                />
                <label htmlFor={`user_${user.id}`} className="text-sm text-gray-700">
                  {user.name}
                </label>
              </div>
            ))}
            {filteredUsers.length === 0 && searchTerm && (
              <div className="text-sm text-gray-500 text-center py-2">
                No se encontraron usuarios con &quot;{searchTerm}&quot;
              </div>
            )}
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={selectedUsers.length === 0}
            className="flex-1"
          >
            Crear Grupo
          </Button>
        </div>
      </form>
    </div>
  );
}; 