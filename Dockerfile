# syntax=docker/dockerfile:1
#
# All-in-one image: frontend + both Go services in a single container.
#   docker build -t sezzlemath . && docker run --rm -p 8080:80 sezzlemath
#
# For the recommended multi-container setup (one process per container) use
# `docker compose up --build` instead; this image exists for one-command demos.

FROM node:24-alpine AS web
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

FROM golang:1.26-alpine AS calculator
WORKDIR /src
COPY services/calculator-service/ .
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /out/calculator-service ./cmd/server

FROM golang:1.26-alpine AS history
WORKDIR /src
COPY services/history-service/go.mod services/history-service/go.sum ./
RUN go mod download
COPY services/history-service/ .
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /out/history-service ./cmd/server

FROM nginx:1.29-alpine
RUN adduser -D -u 10001 app && mkdir /data && chown app /data
COPY --from=calculator /out/calculator-service /usr/local/bin/
COPY --from=history /out/history-service /usr/local/bin/
COPY --from=web /app/dist /usr/share/nginx/html
COPY frontend/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY docker/all-in-one.sh /usr/local/bin/all-in-one.sh

ENV CALCULATOR_UPSTREAM=127.0.0.1:8081 \
    HISTORY_UPSTREAM=127.0.0.1:8082 \
    CALCULATOR_URL=http://127.0.0.1:8081 \
    DB_PATH=/data/history.db
VOLUME /data
EXPOSE 80
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/api/history/v1/history?limit=1 >/dev/null || exit 1
# nginx's entrypoint renders the template, then runs our supervisor script.
CMD ["/usr/local/bin/all-in-one.sh"]
