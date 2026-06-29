# 1. Start with a lightweight Linux server that has Node v24 pre-installe
FROM node:24-slim
# 2. Navigate to the working directory inside the container
WORKDIR /usr/src/app

# 3. Copy the package files first (for caching!)
COPY package*.json ./
COPY prisma ./prisma/

# 4. Install production dependencies
RUN npm install

# 5. Generate the Prisma Client for Linux
RUN npx prisma generate

# 6. Copy the rest of your source code (excluding node_modules because of .dockerignore!)
COPY . .

# 7. Expose the port your API runs on
EXPOSE 3000

# 8. Start the Node API by default
CMD ["node", "src/index.js"]