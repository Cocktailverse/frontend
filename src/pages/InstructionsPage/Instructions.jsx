import React, { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar/Navbar';
import Counter from '../../components/Counter/Counter';
import Piano from '../../components/Piano/Piano';
import ColorGame from '../../components/ColorGame/ColorGame';
import { obtenerCocteles } from '../../services/api';
import './Instructions.css';

const InstructionsPage = () => {
  const [cocktails, setCocktails] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function cargarCocteles() {
      setIsLoading(true);
      try {
        const data = await obtenerCocteles();
        if (isMounted) {
          setCocktails(Array.isArray(data) ? data : []);
        }
      } catch (error) {
         
        console.warn('No fue posible cargar cócteles para la página de instrucciones.', error);
        if (isMounted) {
          setCocktails([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    cargarCocteles();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="instructions-page">
      <Navbar />

      <main className="instructions-content">
        <h1>Guía de Uso — CocktailVerse</h1>

        <p>Esta página explica el propósito y la interacción de los componentes principales de la aplicación. Usa esta guía para orientarte rápidamente.</p>

        {/* Segundo elemento visual con su propio estilo CSS */}
        <div className="secondary-element">
          <div className="secondary-content">
            <h2 className="secondary-title">Recomendación rápida</h2>
            <p className="secondary-text">Prueba la cuenta demo para explorar la app sin configuraciones: inicia sesión con credenciales demo y prueba los componentes interactivos más abajo.</p>
            <span className="secondary-badge">demo@cocktailverse.com</span>
          </div>
        </div>

        <section className="instruction-card">
          <h2>Barra de navegación (Navbar)</h2>
          <p>La barra superior te permite moverte por la aplicación. Usa los botones para ir a:</p>
          <ul>
            <li><strong>Iniciar sesión</strong>: pantalla de autenticación / inicio.</li>
            <li><strong>MainPage</strong>: explora y busca cócteles.</li>
            <li><strong>About Us</strong>: información del equipo.</li>
            <li><strong>Instrucciones</strong>: esta página.</li>
          </ul>
          <p>Haz click en el logo para volver al Inicio.</p>
        </section>

        <section className="instruction-card alt">
          <h2>Modo Día / Noche (DarkMode)</h2>
          <p>Haz clic en el ícono del cóctel en la esquina (componente <code>DarkMode</code>) para alternar entre modo día y noche. El tema se guarda en <code>localStorage</code>, por lo que tu preferencia se mantiene entre sesiones.</p>
          <p>Interacción: pulsa el botón, el logo hace una pequeña rotación y el tema cambia en toda la página.</p>
        </section>

        <section className="instruction-card">
          <h2>Explorar cócteles (MainPage)</h2>
          <p>En <strong>MainPage</strong> verás una cuadrícula de tarjetas con imágenes y una breve descripción. Interacciones clave:</p>
          <ul>
            <li><strong>Buscar:</strong> usa la barra de búsqueda para filtrar por nombre, descripción o ingredientes.</li>
            <li><strong>Ver receta:</strong> pulsa el botón "Ver receta" en una tarjeta para abrir un modal con la imagen, ingredientes y pasos. (Componente <code>CocktailModal</code>).</li>
          </ul>
        </section>

        <section className="instruction-card alt">
          <h2>Cómo crear un cóctel (demo)</h2>
          <p>El flujo real de creación depende del backend. Para probarlo con la cuenta demo:</p>
          <ol>
            <li><strong>Inicia sesión</strong> desde la landing o usa el botón <em>Iniciar sesión demo</em> en <code>MainPage</code>. Las credenciales cargadas con el seed son <code>demo@cocktailverse.com</code> / <code>Demo123!</code>.</li>
            <li><strong>Abre el formulario</strong> pulsando <em>Crear cóctel</em>. Sólo aparece para usuarios autenticados.</li>
            <li><strong>Completa los campos</strong> (nombre, descripción, instrucciones, imagen y lista de ingredientes). El cliente envía los datos al endpoint <code>POST /api/cocktails</code>.</li>
            <li><strong>Envía el formulario</strong>. Si el backend responde 201, el nuevo cóctel se agrega al inicio de la cuadrícula.</li>
          </ol>

          <p><strong>Notas importantes:</strong></p>
          <ul>
            <li>Los favoritos quedan almacenados sólo en la sesión actual del navegador.</li>
            <li>Recuerda ejecutar el backend localmente, con la base de datos configurada, antes de probar este flujo.</li>
          </ul>
        </section>

        <section className="instruction-card">
          <h2>Modal de receta (CocktailModal)</h2>
          <p>Cuando abras una receta verás:</p>
          <ul>
            <li>Imagen del cóctel.</li>
            <li>Lista de ingredientes.</li>
            <li>Instrucciones de preparación.</li>
          </ul>
          <p>Cierra el modal haciendo click fuera del contenido o en el botón de cerrar (×).</p>
        </section>

        <section className="instruction-card alt">
          <h2>Contador (Counter)</h2>
          <p>Cada vez que pulses <strong>¡Descubrir!</strong> el contador aumenta y se sugiere un cóctel aleatorio usando el mismo diseño de las tarjetas de la <strong>MainPage</strong>.</p>
        </section>

        <section className="instruction-card">
          <h2>Piano interactivo (Piano)</h2>
          <p>El piano reproduce notas usando la Web Audio API. Puedes tocarlo con el mouse o con el teclado:</p>
          <ul>
            <li>Teclas naturales: A, S, D, F, G, H, J</li>
            <li>Teclas sostenidas: W, E, T, Y, U</li>
          </ul>
          <p>Mantén la tecla o el click para sostener la nota. Su uso es lúdico y sirve para mostrar eventos de teclado y audio en la app.</p>
        </section>

        <div className="theme-toggle-wrapper">
          <h2>Prueba interactiva</h2>
          <p>Puedes interactuar con algunos componentes aquí abajo sin salir de esta página:</p>
          <div style={{ display: 'grid', gap: 16 }}>
            <Counter cocktails={cocktails} />
            <Piano />
            <ColorGame />
          </div>
          {isLoading ? (
            <p style={{ marginTop: 12, color: 'var(--muted-foreground)' }}>
              Cargando cócteles desde el backend…
            </p>
          ) : cocktails.length === 0 ? (
            <p style={{ marginTop: 12, color: 'var(--muted-foreground)' }}>
              No hay cócteles disponibles o la API no respondió. Revisa la conexión y vuelve a intentar.
            </p>
          ) : null}
        </div>

      </main>
    </div>
  );
};

export default InstructionsPage;
