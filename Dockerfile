FROM node:18-alpine

WORKDIR /app

# Copy package.json
COPY package.json .

# Install dependencies
RUN npm install

# Copy all files
COPY . .

# Expose port for development
EXPOSE 5000 3000 6379 27017

# Run docker-compose
CMD ["npm", "install", "-g", "docker-compose"]
