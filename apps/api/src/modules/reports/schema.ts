import { dailySummaries } from "@/db/schema";
import { withSuccess } from "@/shared";
import { createSelectSchema } from "drizzle-typebox";
import { t, validationDetail, type Static } from "elysia";

// --- Request Schemas ---

export const schemaQueryDailySummary = t.Object({
  date: t.String({
    format: "date",
    error: validationDetail("Must be in YYYY-MM-DD date format"),
  }),
});

export type ArgsQueryDailySummary = Static<typeof schemaQueryDailySummary>;

export const schemaQueryDailyRange = t.Object({
  from: t.String({
    format: "date",
    error: validationDetail("Must be in YYYY-MM-DD date format"),
  }),
  to: t.String({
    format: "date",
    error: validationDetail("Must be in YYYY-MM-DD date format"),
  }),
});

export type ArgsQueryDailyRange = Static<typeof schemaQueryDailyRange>;

export const schemaQueryMonthlySummary = t.Object({
  month: t.String({
    pattern: "^\\d{4}-\\d{2}$",
    error: validationDetail("Month format must be YYYY-MM"),
  }),
});

export type ArgsQueryMonthlySummary = Static<typeof schemaQueryMonthlySummary>;

// --- Response Schemas ---

const baseDailySummary = createSelectSchema(dailySummaries);

export const schemaResponseDaily = withSuccess(baseDailySummary);

export const schemaResponseDailyRange = withSuccess(
  t.Array(
    t.Object({
      date: t.String(),
      retailRevenue: t.Number(),
      brilinkCommission: t.Number(),
      trxCount: t.Number(),
    })
  )
);

export const schemaResponseMonthly = withSuccess(
  t.Object({
    month: t.String(),
    retailRevenue: t.Number(),
    retailCogs: t.Number(),
    brilinkCommission: t.Number(),
    totalRevenue: t.Number(),
    grossProfit: t.Number(),
    trxCount: t.Number(),
  }),
);
