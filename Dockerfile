FROM node:20
WORKDIR src
RUN npm install
EXPOSE 3000
CMD ["npm", "run", "start"]
