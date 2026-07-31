# ============================================================
# Kids Colouring Book E-commerce Platform
# Frontend Dockerfile (Nginx Production Build)
# ============================================================

# Stage 1: Build React App
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files first (layer caching)
COPY package*.json ./

# Install dependencies (npm install tolerates lock-file drift; ci fails hard on it)
RUN npm install --no-audit --no-fund

# Copy source
COPY . .

# Build arguments (Railway passes matching service variables in as build args).
ARG VITE_API_BASE_URL
ARG VITE_RAZORPAY_KEY_ID
ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_APP_NAME="Kids Colouring Books"

# Promote to ENV so Vite embeds them into the bundle at build time. The Razorpay
# KEY ID is a publishable value (safe in client code); the SECRET stays backend-only.
ENV VITE_RAZORPAY_KEY_ID=$VITE_RAZORPAY_KEY_ID
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
ENV VITE_APP_NAME=$VITE_APP_NAME

# Build the app
RUN npm run build

# Stage 2: Nginx Runtime
FROM nginx:1.25-alpine AS runtime

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Custom nginx config for React SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
EXPOSE 443

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD wget -qO- http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
