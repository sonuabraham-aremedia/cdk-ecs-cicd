FROM node:18.6.0-alpine3.15
RUN addgroup app && adduser -S -G app app
USER app
WORKDIR /app
RUN chown -R $(whoami) /app
COPY --chown=app:node package*.json ./
RUN npm install

#RUN mkdir node_modules/.cache && chmod -R 777 node_modules/.cache

#COPY --chown=app:node . .
COPY . .
#ENV API_URL=http://api.myapp.com/
EXPOSE 3000
# Shell form
# /bin/sh
# This command will spin a new shell and execute the command there
# CMD npm start

# Exec form
CMD ["npm", "start"]