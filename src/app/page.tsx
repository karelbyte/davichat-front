'use client';

import React, { useState } from 'react';
import { LoginPage } from '../components/pages/LoginPage/LoginPage';
import { ChatPage } from '../components/pages/ChatPage/ChatPage';
import { User } from '../services/api';

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
  };

  if (!isLoggedIn) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return <ChatPage currentUser={currentUser} />;
}
