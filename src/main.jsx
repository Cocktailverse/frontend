import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { ProveedorAutenticacion } from './context/AuthContext';

const root = createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ProveedorAutenticacion>
      <App />
    </ProveedorAutenticacion>
  </React.StrictMode>,
);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .catch((error) => {
        console.warn('No se pudo registrar el Service Worker:', error);
      });
  });
}
