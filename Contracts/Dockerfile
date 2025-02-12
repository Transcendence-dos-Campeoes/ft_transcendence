FROM node:18
WORKDIR /usr/src/contracts

# Copy only package files first
COPY package*.json ./
RUN npm ci --quiet

# Copy project files
COPY contracts ./contracts
COPY scripts ./scripts
COPY hardhat.config.js .

USER node

ENTRYPOINT ["npx", "hardhat", "run", "scripts/deploy.js", "--network", "sepolia"]