FROM node:18 AS build
WORKDIR /usr/src/app
COPY . /usr/src/app
RUN npm install --legacy-peer-deps
RUN npm run build

FROM node:18
WORKDIR /usr/src/app
RUN npm install -g npm@9
COPY --from=build /usr/src/app/node_modules /usr/src/app/node_modules
COPY --from=build /usr/src/app/dist /usr/src/app/dist
COPY --from=build /usr/src/app/package.json /usr/src/app/package.json
EXPOSE 3000
ENTRYPOINT ["/usr/local/bin/npm", "run"]
CMD ["start:dist"]
