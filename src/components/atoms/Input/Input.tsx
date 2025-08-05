import React from 'react';

interface InputProps {
  type?: 'text' | 'email' | 'password' | 'file';
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyPress?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  accept?: string;
  id?: string;
  name?: string;
}

export const Input: React.FC<InputProps> = ({
  type = 'text',
  placeholder,
  value,
  onChange,
  onKeyPress,
  required = false,
  disabled = false,
  className = '',
  accept,
  id,
  name
}) => {
  const baseClasses = 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black';
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';
  
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      onKeyPress={onKeyPress}
      required={required}
      disabled={disabled}
      className={`${baseClasses} ${disabledClasses} ${className}`}
      accept={accept}
      id={id}
      name={name}
    />
  );
}; 