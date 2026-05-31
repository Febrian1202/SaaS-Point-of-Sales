import { t, validationDetail, type Static } from "elysia";
import { withSuccess, schemaUser, schemaResponseSuccess } from "@/shared";

// Konstanta
const REGEX_SAFE_TEXT = "^[a-zA-Z0-9 .,'-]+$";
const SAFE_TEXT_ERROR =
  "Only letters, numbers, spaces, periods, commas, hyphens, and quotation marks are allowed.";

const nameSchema = (label: string) =>
  t.String({
    minLength: 3,
    pattern: REGEX_SAFE_TEXT,
    error: validationDetail(
      `${label} must be at least 3 characters. ${SAFE_TEXT_ERROR}`,
    ),
  });

// Schema Request
export const schemaBodyRegisterCashier = t.Object({
  name: nameSchema("Cashier name"),
  email: t.String({
    format: "email",
    error: validationDetail("Email format is not valid"),
  }),
  password: t.String({
    minLength: 6,
    error: validationDetail("Password must be atleast 6 characters"),
  }),
});

export const schemaParamsUserId = t.Object({
  id: t.String({
    format: "uuid",
    error: validationDetail("ID must be a UUID"),
  }),
});

export const schemaBodyUpdateCashier = t.Partial(schemaBodyRegisterCashier);

export type ArgsUpdateCashier = Static<typeof schemaBodyUpdateCashier>;

export type ArgsRegisterCashier = Static<typeof schemaBodyRegisterCashier>;

export const schemaBodyUpdateProfile = t.Object({
  name: t.Optional(nameSchema("Name")),
  password: t.Optional(
    t.String({
      minLength: 6,
      error: validationDetail("Password must be atleast 6 characters"),
    }),
  ),
});

export type ArgsUpdateProfile = Static<typeof schemaBodyUpdateProfile>;

// Schema Response
export const schemaResponseMe = withSuccess(schemaUser);

export const schemaResponseRegisterCashier = withSuccess(schemaUser);

export const schemaResponseGetCashier = withSuccess(t.Array(schemaUser));

export const schemaResponseUpdateCashier = withSuccess(schemaUser);

export const schemaResponseDeleteCashier = schemaResponseSuccess;

export const schemaResponseUpdateProfile = withSuccess(schemaUser);
