FROM node:24-bookworm-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts --no-audit --no-fund
COPY api ./api
COPY core ./core
COPY shared ./shared
COPY worker ./worker
COPY web ./web
COPY tools/admin-setup.cjs tools/provision-owner.cjs ./tools/
COPY deploy/preflight.cjs ./tools/deployment-preflight.cjs
RUN mkdir -p /data && chown node:node /data
USER node
ENV ORBIT_OWNER_DATA=/data ORBIT_OWNER_HOST=0.0.0.0 PORT=4545
EXPOSE 4545
CMD ["node", "api/server.cjs"]
