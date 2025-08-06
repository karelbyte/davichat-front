import React, { useState } from 'react';
import { Button } from '../../atoms/Button/Button';
import { SearchInput } from '../../atoms/SearchInput/SearchInput';
import { User, Conversation } from '../../../services/api';

interface AddParticipantsFormProps {
  users: User[];
  currentUserId: string;
  currentConversation: Conversation;
  onSubmit: (participants: string[]) => void;
  onCancel: () => void;
}

export const AddParticipantsForm: React.FC<AddParticipantsFormProps> = ({
  users,
  currentUserId,
  currentConversation,
  onSubmit,
  onCancel
}) => {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUsers.length === 0) return;

    onSubmit(selectedUsers);
  };

  const availableUsers = users
    .filter(user => 
      user.id !== currentUserId && 
      !currentConversation.participants.includes(user.id)
    )
    .filter(user => 
      searchTerm === '' || 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Añadir Participantes</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Usuarios disponibles
          </label>
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Buscar usuarios..."
            className="mb-3"
          />
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {availableUsers.map(user => (
              <div key={user.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`add_user_${user.id}`}
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
                <label htmlFor={`add_user_${user.id}`} className="text-sm">
                  {user.name}
                </label>
              </div>
            ))}
            {availableUsers.length === 0 && searchTerm && (
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
            Añadir Seleccionados
          </Button>
        </div>
      </form>
    </div>
  );
}; 