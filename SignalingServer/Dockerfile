FROM node:10-alpine

WORKDIR /app

ENV SIGNAL_PORT=8080

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE $SIGNAL_PORT/tcp
EXPOSE $SIGNAL_PORT/udp

CMD ["node", "signalingServer.js"]
