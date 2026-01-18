FROM node:24.12.0-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .


WORKDIR /app
RUN cp sample.env .env
RUN cd config \
    && cp sample-config.js config.js

WORKDIR /app/v2-sortd-games
RUN npm install
RUN npm run build

WORKDIR /app

EXPOSE 3002

CMD ["node", "sortd-game-server.js"]
