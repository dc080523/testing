# Use official Node.js image from Docker Hub
FROM node:14

# Create and set working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (if exists)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the app's source code
COPY . .

# Expose the port your app will run on
EXPOSE 3000

# Start the app
CMD ["node", "server.js"]
