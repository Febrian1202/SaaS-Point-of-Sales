import { adminGuard, authPlugin } from "@/plugins";
import Elysia from "elysia";
import { SummaryNotFoundError, InvalidDateRangeError } from "./error";
import {
  schemaQueryDailySummary,
  schemaQueryMonthlySummary,
  schemaQueryDailyRange,
  schemaResponseDaily,
  schemaResponseMonthly,
  schemaResponseDailyRange,
} from "./schema";
import {
  getDailySummary,
  getMonthlySummary,
  getDailyRangeSummary,
} from "./service";
import { schemaResponseError } from "@/shared";

export const reportRoutes = new Elysia({
  prefix: "/reports",
  name: "Report Routes",
  tags: ["Report Routes"],
})
  .error({
    NOT_FOUND: SummaryNotFoundError,
    INVALID_RANGE: InvalidDateRangeError,
  })
  .onError(({ code, set, error }) => {
    if (code === "NOT_FOUND") {
      set.status = 404;
      return { success: false, message: error.message };
    }
    if (code === "INVALID_RANGE") {
      set.status = 400;
      return { success: false, message: error.message };
    }
  })
  .use(authPlugin)
  .use(adminGuard)
  .get(
    "/daily",
    async ({ tenantId, query }) => {
      const result = await getDailySummary(tenantId, query);

      return {
        success: true,
        message: "Get daily summary data success!",
        data: result,
      };
    },
    {
      query: schemaQueryDailySummary,
      response: {
        200: schemaResponseDaily,
        404: schemaResponseError,
      },
      detail: {
        summary: "Laporan Harian",
        description:
          "Mendapatkan ringkasan performa toko untuk hari tertentu. Mencakup total pendapatan ritel, komisi Brilink, dan laba kotor. Jika data belum tersedia, sistem akan mencoba men-generate-nya secara otomatis.",
      },
    },
  )
  .get(
    "/daily-range",
    async ({ tenantId, query }) => {
      const result = await getDailyRangeSummary(tenantId, query);

      return {
        success: true,
        message: "Get daily range report success",
        data: result,
      };
    },
    {
      query: schemaQueryDailyRange,
      response: {
        200: schemaResponseDailyRange,
        400: schemaResponseError,
      },
      detail: {
        summary: "Laporan Rentang Harian",
        description:
          "Mendapatkan tren performa toko (revenue ritel, komisi Brilink, jumlah transaksi) dalam rentang tanggal tertentu (maksimal 31 hari).",
      },
    },
  )
  .get(
    "/monthly",
    async ({ tenantId, query }) => {
      const result = await getMonthlySummary(tenantId, query);

      return {
        success: true,
        message: `Get monthly summary for ${query.month} success`,
        data: result,
      };
    },
    {
      query: schemaQueryMonthlySummary,
      response: {
        200: schemaResponseMonthly,
        404: schemaResponseError,
      },
      detail: {
        summary: "Laporan Bulanan",
        description:
          "Mendapatkan ringkasan performa toko untuk bulan tertentu berdasarkan agregasi laporan harian.",
      },
    },
  );
