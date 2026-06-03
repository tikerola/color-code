FROM node:20

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Install Chromium and its OS dependencies via Playwright's tooling
RUN npx playwright install --with-deps chromium

COPY . .
RUN npm run build

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["npm", "start"]
