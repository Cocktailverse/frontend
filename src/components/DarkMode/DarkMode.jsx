// src/components/DarkMode/DarkMode.jsx

import React, { useState, useEffect } from 'react';
import './DarkMode.css';

const DarkMode = () => {
  const [isDark, setIsDark] = useState(false);

  // Al cargar, verifica si ya hay un tema guardado
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const dark = savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setIsDark(dark);
    if (dark) {
      document.body.classList.add('dark-mode');
    }
  }, []);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);

    if (newIsDark) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className={`theme-toggle-button ${isDark ? 'dark' : 'light'}`}
      aria-label={isDark ? 'Cambiar a modo día' : 'Cambiar a modo noche'}
      title={isDark ? 'Cambiar a modo día' : 'Cambiar a modo noche'}
    >
      <div className="toggle-track">
        <div className={`toggle-thumb ${isDark ? 'dark' : 'light'}`}>
          <span className="toggle-icon">{isDark ? '🌙' : '☀️'}</span>
        </div>
      </div>
    </button>
  );
};

export default DarkMode;