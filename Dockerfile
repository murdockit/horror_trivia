FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY . .

ENV PORT=4040

EXPOSE 4040

CMD ["sh", "-c", "npm run seed && node server.js"]
