# Usar una imagen base de Node
FROM node:14

# Establecer el directorio de trabajo en el contenedor
WORKDIR /usr/src/app

# Copiar el package.json y package-lock.json (si está disponible)
COPY package*.json ./

# Instalar dependencias del proyecto
RUN npm install

# Copiar todos los archivos del proyecto al contenedor
COPY . .

# Exponer el puerto que tu app utiliza
EXPOSE 4000

# Comando para ejecutar la app
CMD ["node", "index.js"]
