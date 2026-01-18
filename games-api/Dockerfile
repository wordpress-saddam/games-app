FROM node:24.12.0-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

WORKDIR /app/apps/admin
RUN npm install

WORKDIR /app/apps/admin-frontend
RUN npm install
RUN npm run build

WORKDIR /app/core_libs
RUN npm install

WORKDIR /app/apps/devapi
RUN npm install

WORKDIR /app
RUN cd config && cp sample-config.js config.js

WORKDIR /app/apps/devapi

RUN ls -la devapi-server.js

EXPOSE 5002

CMD ["node", "devapi-server.js"]
