import React, { useMemo, useState } from 'react';
import './Counter.css';

const Counter = ({ cocktails = [], onShowCocktail }) => {
  const [count, setCount] = useState(0);
  const [selectedCocktail, setSelectedCocktail] = useState(null);

  const hasCocktails = cocktails.length > 0;

  const handleIncrement = () => {
    setCount((prev) => prev + 1);

    if (!hasCocktails) {
      setSelectedCocktail(null);
      return;
    }

    const randomIndex = Math.floor(Math.random() * cocktails.length);
    setSelectedCocktail(cocktails[randomIndex]);
  };

  const cocktailIngredientsPreview = useMemo(() => {
    if (!selectedCocktail?.ingredients?.length) {return '';}
    return selectedCocktail.ingredients.slice(0, 3).join(' · ');
  }, [selectedCocktail]);

  return (
    <section className="counter-container" aria-live="polite">
      <h3 className="counter-heading">¡Descubre más cócteles!</h3>
      <p className="counter-value">{count}</p>

      <button
        type="button"
        className="counter-button"
        onClick={handleIncrement}
      >
        ¡Descubrir!
      </button>

      {!hasCocktails && (
        <p className="counter-empty">
          Agrega cócteles para recibir recomendaciones.
        </p>
      )}

      {selectedCocktail && (
        <article className="counter-card">
          <img
            src={selectedCocktail.imageUrl}
            alt={selectedCocktail.name}
            className="counter-card-image"
          />
          <div className="counter-card-content">
            <h4 className="counter-card-title">{selectedCocktail.name}</h4>
            <p className="counter-card-description">
              {selectedCocktail.description}
            </p>
            {cocktailIngredientsPreview && (
              <p className="counter-card-tags">
                {cocktailIngredientsPreview}
              </p>
            )}
            {onShowCocktail ? (
              <button
                type="button"
                className="counter-card-action"
                onClick={() => onShowCocktail(selectedCocktail)}
              >
                Ver receta
              </button>
            ) : null}
          </div>
        </article>
      )}
    </section>
  );
};

export default Counter;
