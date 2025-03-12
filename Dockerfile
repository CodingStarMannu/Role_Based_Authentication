#official Node.js image
FROM node:18

# working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application files
COPY . .

# Expose the port your app runs on
EXPOSE 8800

# Start the application
CMD ["npm", "run", "dev"]
