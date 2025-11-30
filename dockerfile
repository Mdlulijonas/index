FROM node:18-alpine

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all other files
COPY . .

# Create uploads directory
RUN mkdir -p uploads

# Use Railway's expected port
EXPOSE 8080

# Start the application
CMD ["node", "server.js"]
