FROM node:20
WORKDIR app
COPY . .
RUN sudo npm install
EXPOSE 3000
CMD ["npm", "run", "start"]
