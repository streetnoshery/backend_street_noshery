FROM node:20
WORKDIR src
RUN sudo npm install
EXPOSE 3000
CMD ["npm", "run", "start"]
