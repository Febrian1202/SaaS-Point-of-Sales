import { edenTreaty } from "@elysiajs/eden";
import type { App } from "../../../../api/src/index.ts";
import { env as privateEnv } from "$env/dynamic/private";
import { env as publicEnv } from "$env/dynamic/public";

/**
 * Eden Treaty khusus untuk digunakan di sisi server.
 * Menggunakan dynamic env agar tidak crash saat build/runtime jika variabel belum diset.
 */
const getApiUrl = () => {
    return privateEnv.PRIVATE_API_URL || publicEnv.PUBLIC_API_URL || "http://localhost:3000";
};

export const serverApi = edenTreaty<App>(getApiUrl());
