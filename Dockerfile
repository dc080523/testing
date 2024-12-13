# Step 1: Use the official Node.js image from Docker Hub as the base image
FROM node:14

# Step 2: Set the working directory in the container
WORKDIR /app

# Step 3: Copy the package.json and package-lock.json into the working directory
COPY package*.json ./

# Step 4: Install the dependencies (it will run npm install)
RUN npm install

# Step 5: Copy the rest of your application into the container
COPY . .

# Step 6: Expose the port your app is running on (e.g., 3000)
EXPOSE 3000

# Step 7: Define the command to run your app
CMD ["npm", "start"]
