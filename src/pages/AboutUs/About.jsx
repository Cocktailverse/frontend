import React from 'react';
import './about.css';
import Navbar from '../../components/Navbar/Navbar';

export default function About() {
  return (
    <div className="about-page">
      <Navbar />

      <main className="about-container">
        <h1>Conoce al equipo detrás de CocktailVerse</h1>
        <div className="team-section">
          <div className="team-grid">
            <div className="team-card">
              <img src="/assets/rodas.JPG" alt="Foto de Vicente" />
              <h2>Vicente Rodas</h2>
              <p>Amante del buen cocktail y el código limpio. Cada línea y cada trago tiene una historia que contar.</p>
            </div>

            <div className="team-card">
              <img src="/assets/pekine.jpg" alt="Foto de Joaquín" />
              <h2>Joaquín Errázuriz</h2>
              <p>Desarrollador frontend que mezcla JavaScript como si fuera gin y vermut. Siempre con un cóctel en la mano.</p>
            </div>

            <div className="team-card">
              <img src="/assets/pedro.jpg" alt="Foto de Pedro" />
              <h2>Pedro Rojas</h2>
              <p>Backend y bases de datos. Cree que un buen cóctel, como una buena API, debe ser equilibrado y sin errores.</p>
            </div>
          </div>
        </div>

      </main>

      <footer>
        <p>&copy; 2025 CocktailVerse. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
