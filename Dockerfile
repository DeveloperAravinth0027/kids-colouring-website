# ============================================================
# Full-stack image: builds the React frontend, bakes it into the
# Spring Boot backend's static resources, and runs one service that
# serves BOTH the website (at /) and the API (at /api/**).
#
# Railway: set the service Root Directory to "/" (repo root) and the
# Dockerfile Path to "Dockerfile".
# ============================================================

# -----------------------------
# Stage 1 — build the React app
# -----------------------------
FROM node:20-alpine AS frontend
WORKDIR /fe
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build            # outputs /fe/dist

# -----------------------------
# Stage 2 — build the backend, with the SPA baked into static/
# -----------------------------
FROM maven:3.9.8-eclipse-temurin-21 AS backend
WORKDIR /app
COPY backend/pom.xml .
RUN mvn -q dependency:go-offline
COPY backend/src ./src
# Bundle the built frontend so Spring serves it from classpath:/static
COPY --from=frontend /fe/dist ./src/main/resources/static
RUN mvn -q clean package -DskipTests

# -----------------------------
# Stage 3 — runtime
# -----------------------------
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=backend /app/target/*.jar app.jar
# Deployed image defaults to the prod profile (Railway env vars still override).
ENV SPRING_PROFILES_ACTIVE=prod
EXPOSE 8080
ENTRYPOINT ["java","-jar","app.jar"]
