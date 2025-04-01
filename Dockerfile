FROM node:20
WORKDIR src
COPY package.json package-lock.json ./
RUN npm install
EXPOSE 3000
CMD ["npm", "run", "start"]
