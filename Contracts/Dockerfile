FROM node:18
WORKDIR /usr/src/contracts

COPY package*.json ./
RUN npm install

COPY ./contracts ./contracts
COPY ./scripts ./scripts 
COPY hardhat.config.js .
COPY deploy.sh .

# Fix permissions
RUN chmod +x deploy.sh
USER node

ENTRYPOINT ["sh", "./deploy.sh"]