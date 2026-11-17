# syntax=docker/dockerfile:1
FROM golang:1.26-alpine AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /out/server ./cmd/server

FROM alpine:3.22
RUN adduser -D -u 10001 app && mkdir /data && chown app /data
COPY --from=build /out/server /usr/local/bin/server
USER app
ENV PORT=8082 DB_PATH=/data/history.db CALCULATOR_URL=http://calculator-service:8081
VOLUME /data
EXPOSE 8082
HEALTHCHECK --interval=10s --timeout=3s --start-period=3s --retries=3 \
  CMD wget -qO- http://127.0.0.1:${PORT}/readyz >/dev/null || exit 1
ENTRYPOINT ["server"]
