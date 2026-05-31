// src/plugins/logger.ts
import pino from "pino";
import Elysia from "elysia";

// 1. Konfigurasi Inti Pino
export const log = pino({
  level: Bun.env.NODE_ENV === "production" ? "info" : "debug",
  transport:
    Bun.env.NODE_ENV !== "production"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            ignore: "pid,hostname",
            translateTime: "SYS:standard",
          },
        }
      : undefined,
  redact: [
    "password",
    "body.password",
    "refreshToken",
    "accessToken",
    "headers.authorization",
  ],
});

// 2. Buat Plugin Elysia untuk intercept HTTP Request
export const loggerPlugin = new Elysia({ name: "logger-plugin" })
  .decorate("log", log)
  .derive(() => {
    return {
      startTime: performance.now(),
    };
  })
  .onAfterResponse(({ request, set, startTime }) => {
    const duration = performance.now() - startTime;
    const method = request.method;
    const url = new URL(request.url).pathname;

    // Filter: Jangan log endpoint health check agar terminal tidak berisik
    if (url === "/health") return;

    // Elysia bisa mereturn status kosong (default 200) atau teks (misal: "Not Found")
    const statusCode = set.status ?? 200;

    const logData = {
      method,
      url,
      status: statusCode,
      duration: `${duration.toFixed(2)}ms`,
    };

    const message = `${method} ${url} ${statusCode}`;

    // Menentukan warna/level log berdasarkan status kode HTTP
    if (typeof statusCode === "number") {
      if (statusCode >= 500) {
        log.error(logData, message);
      } else if (statusCode >= 400) {
        log.warn(logData, message);
      } else {
        log.info(logData, message);
      }
    } else {
      // Jika statusnya berbentuk kata string bawaan framework
      log.info(logData, message);
    }
  });
