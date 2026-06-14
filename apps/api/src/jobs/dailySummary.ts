import { db } from "@/db";
import { Cron } from "croner";
import { log } from "@/plugins";
import { eq } from "drizzle-orm";
import { tenants } from "@/db/schema";
import { getDailySummary } from "@/modules/reports/service";

export const startDailySummaryJob = () => {
  // Jalankan setiap tengah malam
  new Cron("0 0 * * *", { timezone: "Asia/Makassar" }, async () => {
    log.info("[CRON] Starting daily summaries automatic...");

    try {
      // Dapatkan tanggal kemarin
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateString = yesterday.toISOString().split("T")[0]!;

      // Ambil semua tenant
      const activeTenants = await db.query.tenants.findMany({
        where: eq(tenants.isActive, true),
        columns: { id: true, name: true },
      });

      // Eksekusi perhitungan untuk masing masing tenant
      for (const tenant of activeTenants) {
        try {
          await getDailySummary(tenant.id, { date: dateString });

          // Menggunakan structured logging
          log.info(
            { tenantId: tenant.id, date: dateString },
            `[CRON] Daily recap for ${tenant.name} success!`,
          );
        } catch (e) {
          // Melempar object error agar Pino bisa merekam stack trace-nya
          const errorMessage = e instanceof Error ? e.message : String(e);
          log.error(
            { tenantId: tenant.id, err: errorMessage },
            `[CRON] Failed processing recap for ${tenant.name}`,
          );
        }
      }

      log.info("[CRON] All daily recap process complete!");
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      log.error({ err: errorMessage }, "[CRON] Something wrong with the job");
    }
  });
};
