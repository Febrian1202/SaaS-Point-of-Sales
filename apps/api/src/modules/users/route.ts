import { adminGuard, authPlugin } from "@/plugins";
import Elysia from "elysia";
import {
  getCashier,
  registerCashier,
  getUser,
  updateCashier,
  deleteCashier
} from "./service";
import { schemaResponseError } from "@/shared";
import {
  schemaResponseGetCashier,
  schemaBodyRegisterCashier,
  schemaResponseRegisterCashier,
  schemaResponseMe,
  schemaParamsUserId,
  schemaBodyUpdateCashier,
  schemaResponseUpdateCashier,
  schemaResponseDeleteCashier
} from "./schema";
import { UserNotFoundError } from "./error";

export const usersRoutes = new Elysia({ prefix: "/users", name: "User Routes", detail: { tags: ["User Routes"] } })
  .error({
    NOT_FOUND: UserNotFoundError
  })
  .onError(({ code, error, set }) => {
    if (code === "NOT_FOUND") {
      set.status = 404;
      return { success: false, message: error.message }
    }
  })
  .use(authPlugin)
  .get("/me", async ({ userId }) => {
    const user = await getUser(userId);

    return {
      success: true,
      message: "Get profile success",
      data: user,
    }
  }, {
    response: {
      200: schemaResponseMe
    },
    detail: {
      summary: "Ambil Profil Pengguna Aktif",
      description: "Mengambil data profil pengguna secara lengkap berdasarkan `accessToken` yang dikirimkan pada *header* Authorization. Biasanya digunakan oleh frontend untuk menampilkan nama dan hak akses kasir yang sedang bertugas di mesin kasir."
    }
  })
  .use(adminGuard)
  .get("/", ({ tenantId }) => {
    const result = getCashier(tenantId);

    return {
      success: true,
      message: "Get cashiers data success",
      data: result
    }
  }, {
    response: {
      200: schemaResponseGetCashier,
      400: schemaResponseError
    },
    detail: {
      summary: "Daftar Semua Kasir (Staf)",
      description: "Mengambil seluruh daftar akun kasir/staf yang bekerja di toko milik Admin yang sedang login aktif. Memastikan isolasi data antar toko (*tenant*) tetap terjaga rapat.\n\n🚨 **Perhatian:** Hanya bisa diakses oleh **Admin**."
    }
  })
  .post("/", async ({ tenantId, body, set }) => {
    const result = await registerCashier(tenantId, body);

    set.status = 201;

    return {
      success: true,
      message: `Cashier ${result.name} registered succesfully`,
      data: result
    }
  }, {
    body: schemaBodyRegisterCashier,
    response: {
      201: schemaResponseRegisterCashier,
      401: schemaResponseError,
      409: schemaResponseError,
    },
    detail: {
      summary: "Daftarkan Kasir Baru (Staf)",
      description: "Mendaftarkan akun staf/kasir baru untuk toko. Akun ini secara otomatis akan diikat ke `tenantId` yang sama dengan milik Admin pembuatnya.\n\n🚨 **Perhatian:** Dilindungi ketat oleh `adminGuard` dan hanya bisa diakses oleh **Admin**."
    }
  })
  .patch("/:id", async ({
    tenantId,
    params,
    body
  }) => {
    const result = await updateCashier(tenantId, params.id, body);

    return {
      success: true,
      message: `Cashier ${result.name} updated successfully`,
      data: result
    }
  }, {
    params: schemaParamsUserId,
    body: schemaBodyUpdateCashier,
    response: {
      200: schemaResponseUpdateCashier,
      404: schemaResponseError
    },
    detail: {
      summary: "Perbarui Data Kasir",
      description: "Memperbarui informasi kasir seperti nama, email, atau mereset password mereka.\n\n🚨 **Perhatian:** Hanya bisa diakses oleh **Admin**."
    }
  })
  .delete("/:id", async ({
    tenantId,
    params: { id }
  }) => {
    const result = await deleteCashier(id, tenantId);

    return {
      success: true,
      message: `Cashier with id: ${result.id} deleted succesfully!`
    }
  }, {
    params: schemaParamsUserId,
    response: {
      200: schemaResponseDeleteCashier,
      404: schemaResponseError,
    },
    detail: {
      summary: "Nonaktifkan Kasir (Soft Delete)",
      description: "Menonaktifkan akun kasir (mengubah status `isActive` menjadi false) sehingga kasir tersebut tidak dapat login lagi. Data tidak dihapus permanen agar riwayat transaksi dan struk lama tidak rusak.\n\n🚨 **Perhatian:** Hanya bisa diakses oleh **Admin**."
    }
  });

