import React, { useState, useEffect } from 'react';
import './Piano.css';

const Piano = () => {
  const notes = [
    { key: 'C', note: 'C4', keyboardKey: 'a' },
    { key: 'C#', note: 'C#4', keyboardKey: 'w', isSharp: true },
    { key: 'D', note: 'D4', keyboardKey: 's' },
    { key: 'D#', note: 'D#4', keyboardKey: 'e', isSharp: true },
    { key: 'E', note: 'E4', keyboardKey: 'd' },
    { key: 'F', note: 'F4', keyboardKey: 'f' },
    { key: 'F#', note: 'F#4', keyboardKey: 't', isSharp: true },
    { key: 'G', note: 'G4', keyboardKey: 'g' },
    { key: 'G#', note: 'G#4', keyboardKey: 'y', isSharp: true },
    { key: 'A', note: 'A4', keyboardKey: 'h' },
    { key: 'A#', note: 'A#4', keyboardKey: 'u', isSharp: true },
    { key: 'B', note: 'B4', keyboardKey: 'j' },
  ];

  const [activeKeys, setActiveKeys] = useState(new Set());

  useEffect(() => {
    const playNote = (note) => {
      const context = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      
      oscillator.connect(gain);
      gain.connect(context.destination);
      
      // Frecuencias notas piano
      const frequencies = {
        'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13,
        'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.00,
        'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
      };
      
      oscillator.frequency.value = frequencies[note];
      oscillator.type = 'sine';
      
      gain.gain.setValueAtTime(0.5, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 1);
      
      oscillator.start();
      oscillator.stop(context.currentTime + 1);
    };

    const handleKeyDown = (e) => {
      const note = notes.find((n) => n.keyboardKey === e.key.toLowerCase());
      if (note && !activeKeys.has(note.note)) {
        setActiveKeys((prev) => new Set([...prev, note.note]));
        playNote(note.note);
      }
    };

    const handleKeyUp = (e) => {
      const note = notes.find((n) => n.keyboardKey === e.key.toLowerCase());
      if (note) {
        setActiveKeys((prev) => {
          const next = new Set(prev);
          next.delete(note.note);
          return next;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [activeKeys]);

  const handleMouseDown = (note) => {
    if (!activeKeys.has(note)) {
      setActiveKeys((prev) => new Set([...prev, note]));
    }
  };

  const handleMouseUp = (note) => {
    setActiveKeys((prev) => {
      const next = new Set(prev);
      next.delete(note);
      return next;
    });
  };

  return (
    <div className="piano-container">
      <div className="piano">
        {notes.map(({ key, note, keyboardKey, isSharp }) => (
          <div
            key={note}
            className={`piano-key ${isSharp ? 'sharp' : 'natural'} ${activeKeys.has(note) ? 'active' : ''}`}
            onMouseDown={() => handleMouseDown(note)}
            onMouseUp={() => handleMouseUp(note)}
            onMouseLeave={() => handleMouseUp(note)}
          >
            <span className="key-label">{keyboardKey}</span>
          </div>
        ))}
      </div>
      <div className="piano-instructions">
        <p>Usa las teclas A-J y W-U para tocar el piano</p>
      </div>
    </div>
  );
};

export default Piano;