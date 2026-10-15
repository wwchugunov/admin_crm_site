FROM node:24-bookworm-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts --no-audit --no-fund
COPY owner/server.cjs owner/accounts.cjs owner/businesses.cjs owner/admin-auth.cjs owner/releases.cjs owner/public-site.cjs owner/mail.cjs owner/registration.cjs owner/bot-workers.cjs ./owner/
COPY src/store.cjs src/security.cjs src/integrations.cjs src/google-config.cjs src/request-proof.cjs ./src/
COPY src/ui/i18n.js ./src/ui/
COPY worker ./worker
COPY web ./web
COPY tools/admin-setup.cjs ./tools/
COPY deploy/preflight.cjs ./tools/deployment-preflight.cjs
RUN mkdir -p /data /releases && chown node:node /data /releases
USER node
ENV ORBIT_OWNER_DATA=/data ORBIT_OWNER_HOST=0.0.0.0 PORT=4545
EXPOSE 4545
CMD ["node", "owner/server.cjs"]
