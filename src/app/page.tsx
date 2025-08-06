'use client';

import React from 'react';
import { ProtectedRoute } from '../components/ProtectedRoute';

export default function Home() {
  return (
    <ProtectedRoute>
      {/* El contenido se maneja dentro de ProtectedRoute */}
      <div />
    </ProtectedRoute>
  );
}
