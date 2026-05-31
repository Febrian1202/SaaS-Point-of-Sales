import { Elysia, t } from "elysia";
import {
  authRoutes,
  brilinkRoutes,
  categoriesRoutes,
  productRoutes,
  transactionRoutes,
  reportRoutes,
  usersRoutes,
} from "@modules/index.routes";
import {
  ConflictError,
  SessionError,
  RegisterError,
  swaggerPlugin,
  corsPlugin,
  loggerPlugin,
} from "@plugin";
import { startDailySummaryJob } from "@jobs";
import { rateLimit } from "elysia-rate-limit";

const app = new Elysia()
  .use(swaggerPlugin)
  .use(loggerPlugin)
  .use(
    rateLimit({
      duration: 60000,
      max: 120,
      errorResponse: new Response("Too many request. Please wait a moment", {
        status: 429,
      }),
    }),
  )
  .use(corsPlugin)
  .error({
    SESSION_ERROR: SessionError,
    REGISTER_ERROR: RegisterError,
    CONFLICT: ConflictError,
  })
  .onError(({ code, set, error, request, log }) => {
    const url = new URL(request.url).pathname;
    const method = request.method;

    const errorMessage = error instanceof Error ? error.message : String(error);

    log.error(`[${code}] ${method} ${url} - ${errorMessage}`);

    if (code === "SESSION_ERROR") {
      set.status = 401;
      return { success: false, message: error.message };
    }
    if (code === "CONFLICT") {
      set.status = 409;
      return { success: false, message: error.message };
    }

    if (code === "REGISTER_ERROR") {
      set.status = 500;
      return { success: false, message: error.message };
    }

    if (code === "UNKNOWN") {
      set.status = 500;
      return { success: false, message: "Something wrong with the server" };
    }
  })
  .get("/health", () => ({ status: "ok", ts: Date.now() }), {
    response: t.Object({
      status: t.String(),
      ts: t.Number(),
    }),
    detail: {
      summary: "Server Health Check",
      description:
        "Mengecek status kesehatan server dan sinkronisasi waktu (timestamp).",
      tags: ["System"],
    },
  })
  .use(authRoutes)
  .use(usersRoutes)
  .use(productRoutes)
  .use(categoriesRoutes)
  .use(transactionRoutes)
  .use(brilinkRoutes)
  .use(reportRoutes)
  .listen(Bun.env.PORT ?? 3000);

startDailySummaryJob();

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
