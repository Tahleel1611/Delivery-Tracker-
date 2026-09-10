FROM node:22-alpine AS dependencies
WORKDIR /app/tracking-web
COPY tracking-web/package*.json ./
RUN npm install --include=optional

FROM node:22-alpine AS builder
WORKDIR /app/tracking-web
COPY --from=dependencies /app/tracking-web/node_modules ./node_modules
COPY tracking-web/ .
COPY prisma/ /app/prisma/
RUN npx prisma generate --schema ../prisma/schema.prisma
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app/tracking-web
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder /app/tracking-web/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/tracking-web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/tracking-web/.next/static ./.next/static
USER nextjs
EXPOSE 3001
ENV PORT=3001
CMD ["node", "server.js"]