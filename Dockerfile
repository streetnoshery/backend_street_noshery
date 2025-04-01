FROM node:20
WORKDIR app
RUN sudo npm install
EXPOSE 3000
CMD ["npm", "run", "start"]
