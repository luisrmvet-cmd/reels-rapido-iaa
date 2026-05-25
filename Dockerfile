FROM node:20-bullseye

RUN apt-get update && apt-get install -y \
chromium \
libnss3 \
libnspr4 \
libatk1.0-0 \
libatk-bridge2.0-0 \
libcups2 \
libdrm2 \
libxkbcommon0 \
libxcomposite1 \
libxdamage1 \
libxfixes3 \
libxrandr2 \
libgbm1 \
libasound2 \
libpangocairo-1.0-0 \
libpango-1.0-0 \
libcairo2 \
libatspi2.0-0 \
libgtk-3-0 \
ffmpeg \
wget \
ca-certificates \
&& rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

RUN npm run build

EXPOSE 10000

CMD ["npm", "start"]
