# Usamos la imagen oficial de Bun
FROM oven/bun:1 as base

WORKDIR /app

# Copiamos los archivos de dependencias
COPY package.json bun.lockb ./

# Instalamos las dependencias
RUN bun install --production

# Copiamos el resto del código del backend
COPY . .

# Render suele usar el puerto 10000, pero exponemos el que uses
# Asegúrate de que tu código lea process.env.PORT
EXPOSE 3000

# Comando para arrancar el servidor
CMD ["bun", "src/server.ts"]
