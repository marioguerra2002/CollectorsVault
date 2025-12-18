# Usamos la imagen oficial de Bun
FROM oven/bun:1 AS base
WORKDIR /app

# 1. Instalamos dependencias
COPY package.json bun.lockb ./
# Si tienes un archivo .npmrc o similar, cópialo también, si no, ignora esto.
RUN bun install --frozen-lockfile

# 2. Copiamos el resto del código
COPY . .

# 3. ARGUMENTOS DE CONSTRUCCIÓN (Aquí está la clave)
# Recuperamos las variables que pusiste en Render
ARG API_URL
ARG NEXT_PUBLIC_API_URL

# Las convertimos en variables de entorno para que Next.js las vea
ENV API_URL=$API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# 4. Construimos la aplicación
RUN bun run build

# 5. Preparamos el arranque
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["bun", "run", "start"]