# Use the official Node.js image
FROM node:20

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the project files
COPY . .

# Expose the port your NestJS app runs on
EXPOSE 3020

# Start the application
CMD ["npm", "run", "start"]
