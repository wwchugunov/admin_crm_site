FROM node:24-bookworm-slim
WORKDIR /app
COPY --chown=node:node server.cjs ./
COPY --chown=node:node public ./public
USER node
ENV HOST=0.0.0.0 PORT=4546
EXPOSE 4546
CMD ["node", "server.cjs"]
