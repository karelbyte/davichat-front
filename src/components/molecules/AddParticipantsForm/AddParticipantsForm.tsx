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
      <h3 className="text-lg font-semibold mb-4 text-gray-700">Añadir Participantes</h3>
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
            {availableUsers.length === 0 ? (
              <div className="text-center py-6">
                <div className="text-gray-400 mb-2">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                {searchTerm ? (
                  <>
                    <p className="text-gray-500 font-medium">No se encontraron usuarios</p>
                    <p className="text-sm text-gray-400 mt-1">Intenta con otro término de búsqueda</p>
                  </>
                ) : (
                  <>
                    <p className="text-gray-500 font-medium">No hay usuarios disponibles</p>
                    <p className="text-sm text-gray-400 mt-1">Todos los usuarios ya están en el grupo</p>
                  </>
                )}
              </div>
            ) : (
              availableUsers.map(user => (
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
                  <label htmlFor={`add_user_${user.id}`} className="text-sm text-gray-700">
                    {user.name}
                  </label>
                </div>
              ))
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