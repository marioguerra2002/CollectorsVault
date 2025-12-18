# Usamos la imagen oficial de Bun
FROM oven/bun:1 AS base
WORKDIR /app

# 1. Instalamos dependencias
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

# 2. Copiamos el resto del código
COPY . .

# 3. Construimos la aplicación (Next.js)
# IMPORTANTE: Pasamos las variables de entorno necesarias para el build si las hay
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN bun run build

# 4. Preparamos el arranque
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["bun", "run", "start"]