FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
ENV NEXT_TELEMETRY_DISABLED=1

RUN node -e "const u=process.env.NEXT_PUBLIC_SUPABASE_URL||''; const k=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||''; if(!u||!k){console.error('PSORE build: variables Supabase publiques absentes'); process.exit(1)}; try{const x=new URL(u); console.log('PSORE build: Supabase public config OK host='+x.host+' keyPrefix='+k.slice(0,6))}catch(e){console.error('PSORE build: NEXT_PUBLIC_SUPABASE_URL invalide'); process.exit(1)}"
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js ./next.config.js
EXPOSE 10000
ENV PORT=10000
CMD ["npm", "start"]
