FROM node:9
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .

# start app
EXPOSE 8080
CMD [ "npm", "start" ]