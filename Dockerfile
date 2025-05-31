FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY server/package*.json ./

# Install dependencies
RUN npm install

# Copy server source code
COPY server/ .

# Expose the port your server runs on
EXPOSE 5000

# Start the server
CMD ["node", "index.js"] 