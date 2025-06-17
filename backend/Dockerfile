# Use the official Playwright base image with all dependencies and browsers
FROM mcr.microsoft.com/playwright:v1.44.0-jammy

# Set working directory
WORKDIR /app

# Install dotenv-cli (if needed)
RUN npm install -g dotenv-cli

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of your project files
COPY . .

# Download Playwright browsers
RUN npx playwright install --with-deps

# Use dotenv-cli to run your app with .env
CMD ["dotenv", "--", "node", "main.js"]

