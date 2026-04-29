# ─── Stage 1: Build ───────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app

# Copy Gradle wrapper and dependency descriptors first (layer cache)
COPY gradlew settings.gradle build.gradle ./
COPY gradle ./gradle
RUN chmod +x gradlew

# Download dependencies (cached unless build.gradle changes)
RUN ./gradlew dependencies --no-daemon -q

# Copy source and build the fat JAR
COPY src ./src
RUN ./gradlew bootJar --no-daemon -x test

# ─── Stage 2: Runtime ─────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Non-root user for security
RUN addgroup -S aglugan && adduser -S aglugan -G aglugan
USER aglugan

COPY --from=build /app/build/libs/*.jar app.jar

EXPOSE 8080

# All sensitive values are injected at runtime via env vars.
# They override the values in application.properties automatically
# (Spring Boot convention: SPRING_DATASOURCE_URL etc.)
ENTRYPOINT ["java", "-jar", "app.jar"]
