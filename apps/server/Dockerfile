# Single stage - run TypeScript directly with tsx
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Create uploads directory
RUN mkdir -p uploads

# Expose port
EXPOSE 3000

# Run with tsx (TypeScript executor)
CMD ["npx", "tsx", "src/index.ts"]
