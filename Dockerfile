FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY . .

RUN npm run seed

ENV PORT=4040

EXPOSE 4040

CMD ["node", "server.js"]
