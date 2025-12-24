# zampedri_frontend_25-2
Proyecto frontend 25-2

https://zampedrifrontend25-2.vercel.app/

## Configuración para conectarse al backend

El frontend consume la API de CocktailVerse usando la URL definida en `VITE_API_BASE_URL`.

1. Copia el archivo `.env.example` a `.env`.
2. Ajusta el valor de `VITE_API_BASE_URL`:
   - Entorno local: `http://localhost:3000/api` (si el backend corre en el puerto 3000).
   - Deploy en Render: `[https://zampedri-backend-25-2.onrender.com/api]` (incluye siempre el sufijo `/api`).
3. Ejecuta `npm install` y luego `npm run dev` para levantar Vite apuntando al backend configurado.

El formulario de inicio de sesión usa la ruta `POST /api/auth/login` y la página principal carga los cócteles mediante `GET /api/cocktails`.

---

## 🤖 Uso de Inteligencia Artificial

En el desarrollo de este frontend se utilizó **GitHub Copilot** como asistente de IA para las siguientes tareas:

### Sistema de Autenticación
- **Formulario login/registro dual-mode**: Implementación de formulario que alterna entre login y registro con animación slide-up fluida
- **Validación de contraseñas**: Campo de confirmación de contraseña con validación en tiempo real

### Sistema de Edición de Cócteles
- **Componente CocktailForm reutilizable**: Formulario dual-mode (create/edit) con hidratación de datos
- **Flujo role-based**: Diferenciación admin (actualización directa) vs usuario (solicitud de edición)
- **Comparación de cambios**: Vista side-by-side de valores actuales vs propuestos en modal de admin
- **Integración con notificaciones**: Sistema de notificaciones para solicitudes y aprobaciones de edición
- **Actualización en tiempo real**: WebSocket para reflejar cambios sin recargar página

### Sistema de Chat en Tiempo Real
- **Componente ChatPanel**: Chat contextualizado por cóctel con auto-scroll y burbujas diferenciadas
- **Hook useCocktailChat**: Gestión de conexión WebSocket, salas por cocktailId, y mensajería bidireccional
- **Integración en CocktailModal**: Sección de chat integrada en vista de detalle de cada cóctel
- **Persistencia de mensajes**: Carga de historial y almacenamiento de nuevos mensajes
- **Estados de UI**: Loading, error, empty states con mensajes contextuales

### Diseño Responsive
- **Mobile-first design**: Implementación completa de diseño responsive con breakpoints (900px, 768px, 500px, 360px)
- **Optimización UX móvil**: 
  - Font-size 16px en inputs para evitar zoom automático en iOS
  - Tap targets mínimos de 44px para mejor usabilidad táctil
  - Ajuste de spacing y padding para pantallas pequeñas
- **Adaptación de componentes**: 
  - Navbar responsive con reorganización de elementos
  - Grids adaptativos en página principal (3→2→1 columnas)
  - Modales optimizados para móviles
  - ChatPanel responsive con altura ajustable
- **Mejoras globales CSS**: 
  - Smooth scroll
  - Tap-highlight transparent
  - Prevención de zoom no deseado

### Configuración de Herramientas
- **ESLint para React**: Configuración de `eslint.config.js` con más de 40 reglas específicas de React
- **Plugins integrados**: react, react-hooks, react-refresh
- **Reglas de calidad**: Detección de hooks incorrectos, keys faltantes, dependencias de efectos

### Estilos y Animaciones
- **Animaciones CSS**: Transiciones suaves con cubic-bezier para slide-up de campos de registro
- **Staggered animations**: Delays escalonados (0.1s, 0.2s, 0.3s) para efecto visual pulido
- **Estados interactivos**: Hover, focus y active states en botones y formularios
- **Media queries avanzadas**: Adaptación granular para diferentes tamaños de dispositivo
- **Dark mode completo**: Soporte para modo oscuro en todos los componentes nuevos (chat, edición, admin)

**Declaración de uso**: Todas las implementaciones fueron revisadas, validadas y adaptadas por el equipo de desarrollo. La IA fue utilizada como herramienta de asistencia, no como sustituto del entendimiento y decisiones técnicas del equipo.

---


# Descripción
Tema escogido: Red social cócteles

# ¿De qué se tratará el proyecto?
El proyecto será una red social temática centrada en la coctelería, llamada CocktailVerse. En esta plataforma, los usuarios podrán crear, compartir, descubrir y mejorar recetas de cócteles en colaboración con otros miembros de la comunidad. Cada cóctel tendrá su propia ficha con ingredientes, pasos de preparación, fotos y comentarios, y podrá ser editado por múltiples usuarios (con revisión moderada). Además, los usuarios podrán seguir a otros creadores, votar recetas, crear listas personalizadas (como “Cócteles para fiestas” o “Clásicos del bar”) y comunicarse en tiempo real mediante un chat dedicado a cada receta.

# ¿Cuál es el fin o la utilidad del proyecto?
El objetivo es crear un espacio colaborativo y social para amantes de los cócteles, donde no solo se consuma contenido, sino que se construya colectivamente. La plataforma fomenta la creatividad, el intercambio de conocimientos y la curaduría comunitaria de recetas de alta calidad, todo ello con herramientas que garantizan orden (moderación) y dinamismo (chat en tiempo real, notificaciones, estados de contenido).

# ¿Quiénes son los usuarios objetivo de su aplicación?
Aficionados a la coctelería que quieren aprender, compartir o mejorar recetas.

Bartenders y mixólogos profesionales que desean mostrar su trabajo o colaborar en innovaciones.

Moderadores o administradores (usuarios con rol especial) encargados de mantener la calidad del contenido.

Visitantes ocasionales interesados en buscar cócteles por ingrediente o ocasión (ej: “cócteles con vodka” o “para fiesta”).


# Diagrama 

![Diagrama](public/assets/diagrama_ER.png)

# Historias de Usuario

Como visitante, quiero registrarme en la plataforma, para poder crear y editar contenido sobre cócteles.

Como usuario registrado, quiero iniciar sesión con mi correo y contraseña, para acceder a mis funcionalidades de edición y socialización.

Como usuario registrado, quiero recuperar mi contraseña si la olvido, para volver a acceder a mi cuenta sin perder mis datos.

Como usuario registrado, quiero crear una nueva ficha de cóctel, para compartir recetas con la comunidad.

Como usuario registrado, quiero editar una ficha de cóctel existente, para corregir errores o mejorar su contenido.

Como visitante, quiero buscar cócteles por ingrediente, para descubrir recetas que usen lo que tengo en casa.

Como moderador, quiero aprobar o rechazar cócteles pendientes de revisión, para garantizar la calidad y normas de la comunidad.

Como usuario registrado, quiero votar un cóctel con una calificación del 1 al 5 y un comentario, para ayudar a otros a identificar las mejores recetas.

Como usuario registrado, quiero personalizar mi perfil con foto y biografía, para que otros miembros me reconozcan y sepan de mis gustos.

Como usuario registrado, quiero seguir a otros creadores de cócteles, para ver sus nuevas publicaciones en mi feed personalizado.

Como usuario registrado, quiero crear listas temáticas de cócteles (ej: “Cócteles de verano”), para organizar mis favoritos y compartirlos con otros.

Como editor de un cóctel, quiero chatear en tiempo real con otros que hayan editado la misma receta, para coordinar mejoras o resolver dudas sobre la ficha.

Como usuario registrado, quiero ver el estado actual de mis cócteles enviados (borrador, pendiente, aprobado, rechazado), para saber en qué etapa se encuentra mi contenido.

Como moderador, quiero dejar un comentario al rechazar un cóctel, para dar retroalimentación útil al autor.

Como usuario registrado, quiero recibir notificaciones en tiempo real cuando alguien comente en mi cóctel o me siga, para mantenerme al tanto de la interacción en mi contenido.

Como visitante, quiero navegar por la landing page y ver cócteles destacados, para entender rápidamente el propósito de la plataforma y decidir si registrarme.


## 🎨 Documento de Diseño

### Paleta de colores

| Tipo | Color | Código HEX | Uso |
|------|-------|------------|-----|
| **Primario (marca)** | Cóctel Naranja | `#D35400` | Logo, botones principales, acentos |
| **Secundario** | Cítrico Suave | `#E67E22` | Hover, estados activos |
| **Fondo general** | Madera Clara | `#FDF6F0` | Fondo de todas las páginas |
| **Texto principal** | Chocolate Oscuro | `#2C1810` | Títulos, párrafos |
| **Texto secundario** | Cacao Medio | `#5A4A42` | Descripciones, subtítulos |
| **Fondo tarjetas/formularios** | Blanco | `#FFFFFF` | Tarjetas, inputs |
| **Éxito** | Lima Fresca | `#2ECC71` | Mensajes de éxito |
| **Advertencia** | Ámbar | `#F39C12` | Contenido “pendiente” |
| **Error** | Granada | `#E74C3C` | Errores, rechazos |
 

| Color | Muestra |
|-------|---------|
| Primario (Cóctel Naranja) | ![Primario](public/assets/colors/primary.svg) |
| Secundario (Cítrico Suave) | ![Secundario](public/assets/colors/secondary.svg) |
| Fondo (Madera Clara) | ![Fondo](public/assets/colors/bg.svg) |
| Texto principal (Chocolate Oscuro) | ![Texto principal](public/assets/colors/text-primary.svg) |
| Texto secundario (Cacao Medio) | ![Texto secundario](public/assets/colors/text-secondary.svg) |
| Fondo tarjetas (Blanco) | ![Blanco](public/assets/colors/white.svg) |
| Éxito (Lima Fresca) | ![Éxito](public/assets/colors/success.svg) |
| Advertencia (Ámbar) | ![Advertencia](public/assets/colors/warning.svg) |
| Error (Granada) | ![Error](public/assets/colors/danger.svg) |

### Tipografía

- **Familia**: `'Segoe UI', Tahoma, Geneva, Verdana, sans-serif`
- **Jerarquía**:
  - Títulos (`h1`): `2.2rem`, peso 700
  - Subtítulos (`h2`): `1.4rem`, peso 600
  - Cuerpo: `1rem`, interlineado `1.6`

### Logo

- **Nombre**: **CocktailVerse**
- **Estilo**: Texto moderno, sin serifas
- **Color**: `#D35400` sobre fondo claro
- **Uso**: Siempre visible en la esquina superior izquierda

### Ejemplos de componentes

- **Botones**: redondeados (`30px`), hover con sombra
- **Tarjetas**: fondo blanco, radio `16px`, animación `fadeInUp` al cargar, hover con elevación
- **Formularios**: inputs con bordes suaves, foco en naranja
- **Estados**:  
  - ✅ Aprobado: verde (`#2ECC71`)  
  - ⏳ Pendiente: ámbar (`#F39C12`)  
  - ❌ Rechazado: rojo (`#E74C3C`)

### Capturas de vistas implementadas

#### Landing Page
| Vista Light | Vista Dark |
|--------|--------|
| ![Explorar Light](public/assets/inicio_claro.png) | ![Explorar Dark](public/assets/inicio_oscuro.png) |

#### Explorar cócteles
![Explorar](public/assets/explorar.png)


#### About Us
| Vista Light | Vista Dark |
|--------|--------|
| ![About Desktop](public/assets/about_claro.png) | ![About Mobile](public/assets/about_oscuro.png) |



#### Detalle de Cóctel
| Modal con información | Modal con chat |
|--------|--------|
| ![Descripción](public/assets/descripcion_cocktail.png) | ![Mensajes](public/assets/mensajes.png) |

#### Editar Cóctel
| Formulario de edición |
|--------|
| ![Editar Cóctel](public/assets/editar_cocktail.png) |

#### Sistema de Valoraciones
| Modal de opiniones |
|--------|
| ![Reseñas](public/assets/reseña.png) |

#### Perfil de Usuario
| Vista de perfil con avatar |
|--------|
| ![Perfil](public/assets/perfil.png) |

#### Panel de Notificaciones
| Notificaciones en tiempo real |
|--------|
| ![Notificaciones](public/assets/notificaciones.png) |

#### Página de Instrucciones
| Guía de uso |
|--------|
| ![Instrucciones](public/assets/instrucciones.png) |

#### Registro de Usuario
| Formulario de registro |
|--------|
| ![Crear Cuenta](public/assets/inicio_crear_cuenta.png) |

#### Admin
| Vista Light | Vista Dark |
|--------|--------|
| ![Admin Light](public/assets/Admin_claro.png) | ![Admin Dark](public/assets/Admin_oscuro.png) |

### Capturas de vistas implementadas mobile

#### Comentar
| Comentar |
|--------|
| ![Comentar](public/assets/comentar_mob.png) |

#### Explorar
| Explorar |
|--------|
| ![Explorar](public/assets/explorar_mob.png) |

#### Inicio
| Inicio |
|--------|
| ![Inicio](public/assets/inicio_mob.png) |

#### Instrucciones
| Instrucciones |
|--------|
| ![Instrucciones](public/assets/ins_mob.png) |

#### Modal
| Modal |
|--------|
| ![Modal](public/assets/modal_mob.png) |

#### Panel Admin
| Panel Admin |
|--------|
| ![Panel Admin](public/assets/paneladmin_mob.png) |

#### Perfil
| Perfil |
|--------|
| ![Perfil](public/assets/perfil_mob.png) |

#### Perfil Admin
| Perfil Admin |
|--------|
| ![Perfil Admin](public/assets/perfiladmin_mob.png) |

#### AboutsUs
| AboutsUs |
|--------|
| ![AboutsUs](public/assets/about_mob.png) |


## Mockup
### Vista inicio
![About Desktop](public/assets/inicio_mockup.png)

### Vista cocktail
![About Desktop](public/assets/cocktail_mockup.png)

### Vista perfil
![About Desktop](public/assets/Perfil_mockup.png)


## Ejemplo de aplicación

A continuación se muestran algunos mockups de la aplicación que ilustran casos comunes de uso: comentar una receta, crear una nueva receta y la vista de perfil de usuario.

| Comentarios | Crear receta | Crear usuario |
|---:|:---:|:---|
| ![Comentar](public/assets/mockup_comentar.png) | ![Crear](public/assets/moclup_crear.png) | ![Usuario](public/assets/mockup_usuario.png) |

