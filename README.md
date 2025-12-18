# Proyecto E08 — Collector's Vault (Plataforma de Intercambio y Colección de Cartas Pokemon TCG)

Aplicación full‑stack para gestionar colecciones de cartas (Pokémon TCG), listas de deseos, búsqueda de usuarios y chats de negociación en tiempo real con Socket.IO.

Incluye:
- Frontend en Next.js 16 (React 19) con App Router, Tailwind y styled-components.
- Backend en Express (TypeScript) ejecutándose con Bun, MongoDB con Mongoose y autenticación por JWT en cookies httpOnly.
- WebSockets con Socket.IO para chat y sincronización de propuestas.
- E2E tests con Selenium + Mocha (cliente) y pruebas unitarias con Vitest (servidor).

---

## Guía de Uso — Funcionalidades desde el Punto de Vista del Usuario

**Collector's Vault** es una plataforma social y colaborativa para coleccionistas de cartas Pokémon TCG. Aquí se describe cómo funciona cada sección principal:

### 1. **Mi Colección**
La sección central donde gestiones tu colección personal de cartas Pokémon.

![Mi Colección](.public/collection.png)

**Características:**
- Visualiza todas tus cartas en un formato de grid con información detallada: nombre, precio estimado, rareza, condición y disponibilidad para intercambio.
- **Filtros avanzados**: Filtra por rareza, condición, tipo de carta y valor total.
- **Ordenamiento**: Ordena por precio o nombre para encontrar cartas fácilmente.
- **Añadir cartas**: Botón "+ Añadir Carta" para integrar nuevas cartas a tu colección.
- Cada carta muestra:
  - Precio estimado (€)
  - Estado de conservación (Buena, Excelente, Casi Graciada, etc.)
  - Indicador de intercambiabilidad (si está disponible para trades)
  - Opción de eliminar la carta

### 2. **Mi Lista de Deseados**
Un espacio para registrar las cartas que deseas obtener.

![Mi Lista de Deseados](.public/wishlist.png)

**Características:**
- Visualiza todas las cartas que quieres poseer.
- Mismo sistema de filtros que la colección (rareza, tipo, valor).
- Ordenamiento rápido por precio o nombre.
- Cada entrada muestra el precio estimado (generalmente €0.00 para cartas deseadas).
- Botón "+ Añadir Carta" para expandir tu wishlist.
- Sistema de seguimiento para organizar tus objetivos de colección.

### 3. **Explorador de Usuarios**
Descubre y conecta con otros coleccionistas en la comunidad.

![Explorador de Usuarios](.public/explore.png)

**Características:**
- Busca otros usuarios por nombre o perfil.
- Visualiza la colección pública de cualquier usuario.
- Información del coleccionista: avatar, estadísticas de colección (valor total, cantidad de cartas).
- Categorización por disponibilidad de intercambio (cartas intercambiables vs. no intercambiables).
- Cada carta ajena muestra su estado y disponibilidad para trade.
- Acceso rápido a proponer intercambios mediante el botón "Realizar Intercambio".

### 4. **Intercambios (Trades)**
Sistema de negociación en tiempo real para proponer y aceptar intercambios de cartas.

![Intercambios](.public/trade.png)

**Características:**
- **Lista de propuestas**: Visualiza propuestas activas de otros usuarios (qué cartas ofrecen y cuáles quieren a cambio).
- **Chat en tiempo real**: Comunícate directamente con el otro coleccionista via Socket.IO para negociar detalles.
- **Gestión de ofertas**:
  - Añadir más cartas a tu oferta mediante "+ Añadir cartas".
  - Visualizar las cartas que el otro usuario propone (lado izquierdo).
  - Mostrar tus cartas ofrecidas (lado derecho).
  - Intercambio bidireccional: ambas partes deben acordar el intercambio.
- **Control de transacción**: 
  - "Aceptar propuesta" para confirmar el intercambio.
  - "Eliminar propuesta" para rechazar o cancelar.
  - "Proponer Intercambio" para crear nuevas negociaciones.
- **Mensajería integrada**: Negocia términos directamente en chat sin cambiar de ventana.

### 5. **Perfil de Usuario**
Página con la información del usuario en la plataforma.

![Perfil de Usuario](.public/profile.png)

**Características:**
- Datos personales: nombre de usuario, email, avatar/imagen de perfil.
- Rol del usuario y fecha de creación de la cuenta.
- Edición de información personal y foto de perfil.

### 6. **Navegación General**
- **Header**: Acceso rápido a todas las secciones, selector de idioma (Español/Inglés) y notificaciones.
- **Búsqueda**: Buscador global para localizar cartas, usuarios o propuestas.
- **Internacionalización (i18n)**: Interfaz completamente traducida a español e inglés.

![Cabecera](.public/header.png)

---

## Arquitectura

- `client/`: Next.js (App Router) con páginas: `login`, `register`, `collection`, `wishlist`, `explore`, `owners`, `trades`, `profile`, e i18n (`messages/en.json`, `messages/es.json`).
- `server/`: API REST + Socket.IO. Rutas para autenticación, usuarios, colección, wishlist, conversaciones y ejecución de intercambios. Conexión a MongoDB.

## Tecnologías clave

- Frontend: Next.js 16, React 19, styled-components, Tailwind 4, socket.io-client, TypeScript.
- Backend: Express 5, Mongoose 8, JWT, cookie-parser, cors, Socket.IO 4, Bun runtime, TypeScript.
- Testing: Mocha + Selenium WebDriver (cliente), Vitest (servidor).

## Requisitos

- Node.js 18+ (para herramientas del cliente)
- Bun 1.2+ (para servidor)
- MongoDB (Atlas o local)
- Google Chrome (para tests e2e con Selenium)

## Instalación

Clonar e instalar dependencias de cliente y servidor:

```bash
# En el directorio raíz del repo
cd client && bun install
cd server && bun install
```

## Variables de entorno

Crear archivo `.env` en `server/`.

Servidor (`server/.env`):

```env
MONGODB_URI="mongodb+srv://admin:admin@collectorsvaultcluster.bdxe99e.mongodb.net/collectorsvault-equipoE08?appName=CollectorsVaultCluster"
JWT_SECRET="En_UnLuG4r:dA_l3M4nch3a:_CUy0::2231242132:N0_q1er0:ac0Rd4rm3!"
```

Cliente (`client/.env.local`):

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## Ejecución en desarrollo

En dos terminales:

```bash
# 1) Servidor (Bun)
cd server
bun --watch src/server.ts

# 2) Cliente (Next.js)
cd client
bun run dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## Scripts útiles

Cliente (`client/package.json`):

- `dev`: arranca Next en modo desarrollo.
- `build`: compila producción de Next.
- `start`: inicia Next en modo producción.
- `lint`: ejecuta ESLint.
- `test:e2e`: ejecuta un spec de ejemplo con Mocha + Selenium.

Servidor (`server/package.json`):

- `dev`: arranca Express con Bun y recarga en cambios (`src/server.ts`).
- `build`: compila TypeScript.
- `start`: ejecuta el build.
- `test`: ejecuta Vitest.

## Resumen de API

Base URL: `http://localhost:5000/api`

- Autenticación (`/auth`):
	- `POST /register` — registro (username, email, password).
	- `POST /login` — login; setea cookie `jwt` httpOnly.
	- `GET /me` — datos del usuario autenticado.
	- `PUT /me` — actualizar perfil.
	- `POST /logout` — limpia cookie de sesión.

- Usuarios (`/users`):
	- `GET /users/search?q=...` — buscar por nombre (requiere auth).
	- `GET /users/:userId` — perfil público.
	- `GET /users/:userId/profileImageUrl` — URL de avatar.

- Colección (`/collection`):
	- `GET /collection` — cartas del usuario (o `?userId=` otro usuario).
	- `GET /collection/filter` — filtrado por `rarity`, `condition`, `cardType`, `isTradable`.
	- `POST /collection/add` — añadir carta a mi colección.
	- `DELETE /collection/:cardId` — eliminar carta de mi colección.

- Wishlist (`/wishlist`):
	- `GET /wishlist` — obtiene la wishlist con detalles desde TCGdex.
	- `POST /wishlist` — añade `cardId` (ID TCGdex como `sv1-1`).
	- `DELETE /wishlist/:cardId` — elimina de la wishlist.

- Conversaciones (`/conversations`):
	- `GET /conversations` — lista de mis conversaciones.
	- `GET /conversations/:otherUserId` — conversación con otro usuario.
	- `POST /conversations/:otherUserId/messages` — añade mensaje.
	- `POST /conversations/:otherUserId/trade-proposal` — guarda última propuesta.
	- `GET /conversations/:otherUserId/trade-proposal` — obtiene última propuesta.
	- `PATCH /conversations/:otherUserId/lock` — bloquea la conversación (aceptada/eliminada).
	- `DELETE /conversations/:otherUserId` — elimina conversación.

> Nota: La mayoría de endpoints requieren autenticación mediante cookie `jwt`.

## WebSockets (Socket.IO)

Servidor publica eventos en `http://localhost:5000`.

Canales/eventos usados:
- `trade:join` — unirse a una sala de trade (`roomId`).
- `user:subscribe` — suscripción a canal personal `user:{userId}`.
- `trade:message` — envío de mensajes/propuestas; persiste al vuelo vía `API_URL`.
- `trade:sync` — broadcast en la sala del trade y canal personal del destinatario.

## i18n (internacionalización)

- Mensajes en `client/messages/en.json` y `client/messages/es.json`.
- `LanguageProvider` y `LanguageSwitcher` gestionan el idioma.

## Tests

Servidor (Vitest):

```bash
cd server
bun run test
```

Cliente (Mocha + Selenium):

```bash
cd client
# Opción A: script definido (un spec de ejemplo)
bun run test:e2e
# Opción B: ejecutar todos los .spec.js
npx mocha tests/**/*.spec.js --timeout 30000
```

Requisitos para E2E: Chrome instalado y `chromedriver` (se instala como devDependency).

## Estructura relevante

```
client/
	src/app/{login,register,collection,wishlist,explore,owners,trades,profile}
	messages/{en.json,es.json}
server/
	src/app/auth/*
	src/app/routers/{collectionRouter,wishlistRouter,conversationRouter,userRouter,...}
	src/app/lib/db/connectDB.ts
	src/server.ts
```

## Troubleshooting

- CORS/credenciales: asegurarse de que las peticiones incluyen credenciales cuando sea necesario.
- JWT: definir `JWT_SECRET` en el servidor; el login setea cookie `jwt` httpOnly.
- Mongo: confirmar `MONGODB_URI` y que la base está accesible.

## Despliegue

- Frontend puede desplegarse en Vercel/Netlify..
- Backend puede desplegarse en Render.

---

## Equipo — Nosotros

Este proyecto fue desarrollado por estudiantes de **Sistemas y Tecnologías Web** en la **Universidad de La Laguna** como parte del curso de desarrollo full-stack.

### Miembros del Equipo E08

<div align="center">

| **Mario Guerra Pérez** | **Alberto Antonio Hernández Hernández** | **José Javier Ramos Carballo** |
|:---:|:---:|:---:|
| [![Mario Guerra](https://github.com/marioguerra2002.png?size=150)](https://github.com/marioguerra2002) | [![Alberto Hernández](https://github.com/Albertohdez02.png?size=150)](https://github.com/Albertohdez02) | [![José Javier Ramos](https://github.com/alu0101313313.png?size=150)](https://github.com/alu0101313313) |
| [GitHub](https://github.com/marioguerra2002) | [GitHub](https://github.com/Albertohdez02) | [GitHub](https://github.com/alu0101313313) |
| 📧 `alu0101395036@ull.edu.es` | 📧 `alu0101433905@ull.edu.es` | 📧 `alu0101313313@ull.edu.es` |

</div>

### Contribuciones

- **Mario Guerra Pérez**: Desarrollo frontend, componentes React, UI/UX, integración Socket.IO
- **Alberto Antonio Hernández Hernández**: Backend API, autenticación JWT, base de datos MongoDB
- **José Javier Ramos Carballo**: Tests E2E, documentación, DevOps y deployment

---

## 📄 Licencia

Este proyecto es de código educativo como parte del curso **Sistemas y Tecnologías Web** de la **Universidad de La Laguna** (2025).

Pokémon y sus respectivas marcas son propiedad de **Nintendo, Game Freak y Creatures Inc.**

---

**Última actualización:** Diciembre 2025 | **Versión:** 1.0.0
