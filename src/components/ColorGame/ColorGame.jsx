import React, { useState, useEffect } from 'react';
import './ColorGame.css';

const ColorGame = () => {
  const [colors, setColors] = useState(['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4']);
  const [sequence, setSequence] = useState([]);
  const [userSequence, setUserSequence] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showRules, setShowRules] = useState(true);
  const [level, setLevel] = useState(1);

  useEffect(() => {
    if (isPlaying && sequence.length === 0) {
      generateSequence();
    }
  }, [isPlaying]);

  useEffect(() => {
    if (sequence.length > 0 && !showRules) {
      playSequence();
    }
  }, [sequence, showRules]);

  const generateSequence = () => {
    const newSequence = Array(level + 2)
      .fill(0)
      .map(() => Math.floor(Math.random() * 4));
    setSequence(newSequence);
  };

  const playSequence = async () => {
    for (let i = 0; i < sequence.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const element = document.getElementById(`color-${sequence[i]}`);
      element.classList.add('active');
      await new Promise((resolve) => setTimeout(resolve, 500));
      element.classList.remove('active');
    }
  };

  const handleColorClick = (colorIndex) => {
    if (!isPlaying || showRules) {return;}

    const newUserSequence = [...userSequence, colorIndex];
    setUserSequence(newUserSequence);

    if (newUserSequence[newUserSequence.length - 1] !== sequence[newUserSequence.length - 1]) {
      alert('¡Secuencia incorrecta! Intenta de nuevo.');
      setUserSequence([]);
      setSequence([]);
      setLevel(1);
      return;
    }

    if (newUserSequence.length === sequence.length) {
      alert('¡Secuencia correcta!');
      setLevel(level + 1);
      setUserSequence([]);
      setSequence([]);
      generateSequence();
    }
  };

  const startGame = () => {
    setShowRules(false);
    setIsPlaying(true);
  };

  return (
    <div className="color-game-container">
      {showRules ? (
        <div className="rules-container">
          <h2>Reglas del Juego</h2>
          <p>1. Se mostrará una secuencia de colores</p>
          <p>2. Memoriza el orden de los colores</p>
          <p>3. Repite la secuencia haciendo clic en los colores</p>
          <p>4. La secuencia aumentará con cada nivel</p>
          <button onClick={startGame} className="start-button">
            Comenzar Juego
          </button>
        </div>
      ) : (
        <>
          <div className="game-info">
            <h3>Nivel: {level}</h3>
            <p>Secuencia actual: {userSequence.length} / {sequence.length}</p>
          </div>
          <div className="color-grid">
            {colors.map((color, index) => (
              <div
                key={index}
                id={`color-${index}`}
                className="color-block"
                style={{ backgroundColor: color }}
                onClick={() => handleColorClick(index)}
              />
            ))}
          </div>
          <button
            onClick={() => {
              setShowRules(true);
              setIsPlaying(false);
              setUserSequence([]);
              setSequence([]);
              setLevel(1);
            }}
            className="reset-button"
          >
            Reiniciar Juego
          </button>
        </>
      )}
    </div>
  );
};

export default ColorGame;