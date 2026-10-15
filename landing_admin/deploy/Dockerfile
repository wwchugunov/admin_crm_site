FROM node:24-alpine
WORKDIR /app
COPY --chown=node:node server.cjs request-proof.cjs package.json ./
COPY --chown=node:node public ./public
USER node
ENV HOST=0.0.0.0 PORT=4547
EXPOSE 4547
CMD ["node","server.cjs"]
