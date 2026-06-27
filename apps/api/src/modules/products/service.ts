import { and, desc, eq, ilike, lte, asc, gte, count } from "drizzle-orm";
import { slugify } from "@helper";
import { products } from "@/db/schema";
import { db } from "@/db";
import { ProductNotFoundError } from "./error";
import { ConflictError } from "@/plugins/error";
import { type ArgsProduct, type ArgsProductUpdate } from "./schema";

export const getProduct = async (
  tenantId: string,
  search?: string,
  barcode?: string,
  categoryId?: string,
  status?: string,
  page?: number,
  limit?: number,
) => {
  const filters = [eq(products.tenantId, tenantId)];

  if (search) filters.push(ilike(products.name, `%${search}%`));

  if (barcode) filters.push(eq(products.barcode, barcode));

  if (categoryId) filters.push(eq(products.categoryId, categoryId));

  if (status === "AVAILABLE") {
    filters.push(gte(products.stockQty, 0));
  } else if (status === "LOW_STOCK") {
    filters.push(lte(products.stockQty, 5));
  } else if (status === "OUT_OF_STOCK") {
    filters.push(eq(products.stockQty, 0));
  }

  const offset = ((page ?? 1) - 1) * (limit ?? 10);

  const result = await db.query.products.findMany({
    columns: {
      id: true,
      slug: true,
      isActive: true,
      name: true,
      barcode: true,
      sellingPrice: true,
      stockQty: true,
      unit: true,
      createdAt: true,
      updatedAt: true,
    },
    limit: limit ?? 10,
    offset: offset,
    where: and(...filters, eq(products.isActive, true)),
    orderBy:
      status !== undefined ? asc(products.stockQty) : desc(products.createdAt),
    with: {
      category: {
        columns: {
          name: true,
        },
      },
    },
  });

  // Hitung seluruh total data yang sesuai dengan filter
  const countResult = await db
    .select({ totalData: count() })
    .from(products)
    .where(and(...filters, eq(products.isActive, true)));

  const totalData = countResult[0]?.totalData ?? 0;

  const totalPages = Math.ceil(totalData / (limit ?? 10));

  return {
    data: result,
    meta: {
      page: page,
      limit: limit,
      totalData: totalData,
      totalPages: totalPages,
    },
  };
};

export const getProductDetail = async (id: string, tenantId: string) => {
  const product = await db.query.products.findFirst({
    columns: {
      id: true,
      name: true,
      barcode: true,
      sellingPrice: true,
      unit: true,
      slug: true,
      stockQty: true,
      createdAt: true,
      updatedAt: true,
    },
    where: and(
      eq(products.tenantId, tenantId),
      eq(products.id, id),
      eq(products.isActive, true),
    ),
    with: {
      category: {
        columns: {
          name: true,
        },
      },
    },
  });

  if (!product)
    throw new ProductNotFoundError("Detail produk tidak ditemukan!");

  return {
    id: product.id,
    name: product.name,
    category: product.category?.name,
    slug: product.slug,
    barcode: product.barcode,
    sellingPrice: product.sellingPrice,
    unit: product.unit,
    stockQty: product.stockQty,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
};

export const postProduct = async (args: ArgsProduct) => {
  if (args.barcode && args.barcode.trim() !== "") {
    const existingBarcode = await db.query.products.findFirst({
      where: and(
        eq(products.tenantId, args.tenantId),
        eq(products.barcode, args.barcode),
      ),
    });

    if (existingBarcode)
      throw new ConflictError(
        `Gagal, Barcode ${args.barcode} sudah digunakan oleh produk lain!`,
      );
  }

  if (!args.name) throw new ConflictError("Gagal, nama tidak boleh kosong!");

  let slug = slugify(args.name);

  const existingSlug = await db.query.products.findFirst({
    where: and(eq(products.slug, slug), eq(products.tenantId, args.tenantId)),
  });

  if (existingSlug) {
    slug = `${slug}-${Math.random().toString(36).substring(2, 6)}`;
  }

  const [newProduct] = await db
    .insert(products)
    .values({
      name: args.name,
      categoryId: args.categoryId,
      tenantId: args.tenantId,
      barcode: args.barcode,
      sellingPrice: args.sellingPrice,
      unit: args.unit,
      stockQty: args.stockQty,
      slug: slug,
    })
    .returning({
      id: products.id,
      name: products.name,
      slug: products.slug,
    });

  return newProduct;
};

export const patchProduct = async (
  id: string,
  tenantId: string,
  args: ArgsProductUpdate,
) => {
  const currentProduct = await db.query.products.findFirst({
    columns: { name: true, barcode: true },
    where: and(eq(products.tenantId, tenantId), eq(products.id, id)),
  });

  if (!currentProduct)
    throw new ProductNotFoundError("Data produk tidak ditemukan!");

  let newSlug: string | undefined = undefined;

  if (args.name && args.name !== currentProduct.name) {
    newSlug = slugify(args.name);

    const existingSlug = await db.query.products.findFirst({
      columns: { id: true },
      where: and(eq(products.tenantId, tenantId), eq(products.slug, newSlug)),
    });

    if (existingSlug && existingSlug.id !== id) {
      newSlug = `${newSlug}-${Math.random().toString(36).substring(2, 6)}`;
    }
  }

  if (args.barcode && args.barcode !== currentProduct.barcode) {
    const existingBarcode = await db.query.products.findFirst({
      columns: { id: true },
      where: and(
        eq(products.tenantId, tenantId),
        eq(products.barcode, args.barcode),
      ),
    });

    if (existingBarcode && existingBarcode.id !== id)
      throw new ConflictError(
        `Barcode ${args.barcode} sudah digunakan oleh produk lain!`,
      );
  }

  const [updatedProduct] = await db
    .update(products)
    .set({
      name: args.name,
      barcode: args.barcode,
      categoryId: args.categoryId,
      sellingPrice: args.sellingPrice,
      slug: newSlug,
      stockQty: args.stockQty,
      unit: args.unit,
    })
    .where(and(eq(products.tenantId, tenantId), eq(products.id, id)))
    .returning();

  return updatedProduct;
};

export const softDeleteProduct = async (id: string, tenantId: string) => {
  const [deletedProduct] = await db
    .update(products)
    .set({
      isActive: false,
    })
    .where(and(eq(products.tenantId, tenantId), eq(products.id, id)))
    .returning();

  if (!deletedProduct)
    throw new ProductNotFoundError("Data produk tidak ditemukan!");

  return deletedProduct;
};
