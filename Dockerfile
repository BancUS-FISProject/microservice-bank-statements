FROM node:24-alpine

WORKDIR /usr/src/app

# Copiar package.json y package-lock para instalar dependencias
COPY package*.json ./

# Permitir seleccionar NODE_ENV en build time. Por defecto production.
ARG NODE_ENV=production

# Instalar dependencias según NODE_ENV: en development instala devDependencies, en production solo production
RUN if [ "$NODE_ENV" = "development" ]; then \
			npm ci; \
		else \
			npm ci --only=production; \
		fi

# Copiar el resto del código (en tiempo de build). En desarrollo docker-compose montará el volumen del código local.
COPY . .

# Exponer y propagar NODE_ENV al runtime
ENV NODE_ENV=${NODE_ENV}

EXPOSE 3000

CMD [ "node", "index.js" ]
