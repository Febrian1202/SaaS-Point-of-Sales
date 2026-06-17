import { and, count, eq, gte, lte, sum } from "drizzle-orm";
import type {
  ArgsQueryDailySummary,
  ArgsQueryMonthlySummary,
  ArgsQueryDailyRange,
} from "./schema";
import { db } from "@db";
import {
  brilinkTransactions,
  dailySummaries,
  transactionItems,
  transactions,
} from "@/db/schema";
import { ConflictError } from "@/plugins";
import { InvalidDateRangeError } from "./error";

export const getDailySummary = async (
  tenantId: string,
  query: ArgsQueryDailySummary,
) => {
  const { date } = query;

  // Cek cache
  const cache = await db.query.dailySummaries.findFirst({
    where: and(
      eq(dailySummaries.tenantId, tenantId),
      eq(dailySummaries.summaryDate, date),
    ),
  });

  if (cache) return cache;

  // Siapkan batas waktu
  const startDate = new Date(`${date}T00:00:00.000Z`);
  const endDate = new Date(`${date}T23:59:59.999Z`);

  // Transaksi ritel
  const retailResult = await db
    .select({
      totalRevenue: sum(transactions.totalAmount),
      totalTrx: count(),
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.tenantId, tenantId),
        eq(transactions.status, "success"),
        gte(transactions.createdAt, startDate),
        lte(transactions.createdAt, endDate),
      ),
    );

  // Barang terjual harian
  const itemsSoldResult = await db
    .select({ totalItemsSold: sum(transactionItems.qty) })
    .from(transactionItems)
    .innerJoin(
      transactions,
      eq(transactionItems.transactionId, transactions.id),
    )
    .where(
      and(
        eq(transactions.tenantId, tenantId),
        eq(transactions.status, "success"),
        gte(transactions.createdAt, startDate),
        lte(transactions.createdAt, endDate),
      ),
    );

  // Transaksi Brilink
  const brilinkResult = await db
    .select({
      totalCommission: sum(brilinkTransactions.agentCommission),
      totalTrx: count(),
    })
    .from(brilinkTransactions)
    .where(
      and(
        eq(brilinkTransactions.tenantId, tenantId),
        eq(brilinkTransactions.status, "success"),
        gte(brilinkTransactions.createdAt, startDate),
        lte(brilinkTransactions.createdAt, endDate),
      ),
    );

  // Kalkulasi
  const retailRevenue = Number(retailResult[0]?.totalRevenue || 0);
  const retailTrxCount = Number(retailResult[0]?.totalTrx || 0);

  const brilinkCommission = Number(brilinkResult[0]?.totalCommission || 0);
  const brilinkTrxCount = Number(brilinkResult[0]?.totalTrx || 0);

  const itemsSold = Number(itemsSoldResult[0]?.totalItemsSold || 0);

  // Kalkulasi total
  const totalRevenue = retailRevenue + brilinkCommission;
  const trxCount = retailTrxCount + brilinkTrxCount;

  const retailCogs = 0;
  const grossProfit = totalRevenue - retailCogs;

  const resultData = {
    tenantId,
    summaryDate: date,
    retailRevenue: retailRevenue.toString(),
    retailCogs: retailCogs.toString(),
    brilinkCommission: brilinkCommission.toString(),
    totalRevenue: totalRevenue.toString(),
    grossProfit: grossProfit.toString(),
    trxCount: trxCount,
    itemsSold: itemsSold,
  };

  // Pengecekan Tanggal
  const today = new Date();

  // Menyesuaikan dengan timezone
  const todayStr = today.toLocaleDateString("en-CA", {
    timeZone: "Asia/Makassar",
  });

  if (todayStr && date >= todayStr) {
    return { ...resultData, id: crypto.randomUUID(), generatedAt: new Date() };
  }

  // Simpan ke cache dan return
  try {
    // Hapus generatedAt dari resultData untuk insert ke database
    const [newSummary] = await db
      .insert(dailySummaries)
      .values(resultData)
      .returning();

    return newSummary;
  } catch (e: any) {
    if (e.code === "23505") {
      const retrySummary = await db.query.dailySummaries.findFirst({
        where: and(
          eq(dailySummaries.tenantId, tenantId),
          eq(dailySummaries.summaryDate, date),
        ),
      });

      return retrySummary;
    }

    throw new ConflictError("Gagal membuat ringkasan harian");
  }
};

export const getMonthlySummary = async (
  tenantId: string,
  query: ArgsQueryMonthlySummary,
) => {
  const { month } = query;

  // Dapatkan tahun dan bulan dari format YYYY-MM
  const [yearStr, monthStr] = month.split("-");
  const year = Number(yearStr);
  const monthNum = Number(monthStr);

  // Cari tanggal terakhir dari bulan yang diminta
  const lastDay = new Date(year, monthNum, 0).getDate();
  const startDate = `${month}-01`;
  const endDate = `${month}-${lastDay.toString().padStart(2, "0")}`;

  // Hindari query masa depan yang tidak relevan (optimasi)
  // Tetapi getDailyRangeSummary akan meng-handle kalkulasi otomatis
  // Kita tarik seluruh data dari tanggal 1 sampai hari terakhir bulan tersebut
  const dailyRanges = await getDailyRangeSummary(tenantId, {
    from: startDate,
    to: endDate,
  });

  // Agregasi hasil array dari getDailyRangeSummary
  const aggregated = dailyRanges.reduce(
    (acc, curr) => {
      acc.retailRevenue += curr.retailRevenue;
      acc.retailCogs += curr.retailCogs || 0;
      acc.brilinkCommission += curr.brilinkCommission;
      acc.totalRevenue += curr.totalRevenue;
      acc.grossProfit += curr.grossProfit;
      acc.trxCount += curr.trxCount;
      return acc;
    },
    {
      retailRevenue: 0,
      retailCogs: 0,
      brilinkCommission: 0,
      totalRevenue: 0,
      grossProfit: 0,
      trxCount: 0,
    },
  );

  return {
    month: month,
    retailRevenue: aggregated.retailRevenue,
    retailCogs: aggregated.retailCogs,
    brilinkCommission: aggregated.brilinkCommission,
    totalRevenue: aggregated.totalRevenue,
    grossProfit: aggregated.grossProfit,
    trxCount: aggregated.trxCount,
  };
};

export const getDailyRangeSummary = async (
  tenantId: string,
  query: ArgsQueryDailyRange,
) => {
  const { from, to } = query;

  const [startY, startM, startD] = from.split("-").map(Number);
  const [endY, endM, endD] = to.split("-").map(Number);

  if (
    startY === undefined ||
    startM === undefined ||
    startD === undefined ||
    endY === undefined ||
    endM === undefined ||
    endD === undefined
  ) {
    throw new InvalidDateRangeError("Format tanggal tidak valid");
  }

  const startDate = new Date(Date.UTC(startY, startM - 1, startD));
  const endDate = new Date(Date.UTC(endY, endM - 1, endD));

  if (endDate < startDate) {
    throw new InvalidDateRangeError(
      "Tanggal 'sampai' tidak boleh sebelum tanggal 'dari'",
    );
  }

  const diffTime = endDate.getTime() - startDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  if (diffDays > 31) {
    throw new InvalidDateRangeError(
      "Rentang waktu tidak boleh lebih dari 31 hari",
    );
  }

  const existingSummaries = await db.query.dailySummaries.findMany({
    where: and(
      eq(dailySummaries.tenantId, tenantId),
      gte(dailySummaries.summaryDate, from),
      lte(dailySummaries.summaryDate, to),
    ),
  });

  const cachedMap = new Map(existingSummaries.map((s) => [s.summaryDate, s]));

  const dates: string[] = [];
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    dates.push(currentDate.toISOString().substring(0, 10));
    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
  }

  const results = await Promise.all(
    dates.map(async (dateStr) => {
      const cache = cachedMap.get(dateStr);
      if (cache) {
        return cache;
      }
      return await getDailySummary(tenantId, { date: dateStr });
    }),
  );

  return results
    .filter((r): r is NonNullable<typeof r> => r !== undefined && r !== null)
    .map((r) => ({
      date: r.summaryDate,
      retailRevenue: Number(r.retailRevenue || 0),
      retailCogs: Number(r.retailCogs || 0),
      brilinkCommission: Number(r.brilinkCommission || 0),
      trxCount: Number(r.trxCount || 0),
      itemsSold: Number(r.itemsSold || 0),
      totalRevenue: Number(r.totalRevenue || 0),
      grossProfit: Number(r.grossProfit || 0),
    }));
};
